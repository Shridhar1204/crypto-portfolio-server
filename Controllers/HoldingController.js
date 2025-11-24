const axios = require("axios");
const NodeCache = require("node-cache");
const Holding = require("../Models/Holding");

// 🔹 Cache for prices (5 minutes)
const priceCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Helper: safely parse numbers
const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

// Helper: fetch prices from CoinGecko in ONE request
const fetchPricesForCoins = async (coinIds) => {
  const prices = {};
  const idsToFetch = [];

  // 1️⃣ Try cache first
  for (const coinId of coinIds) {
    const cached = priceCache.get(coinId);
    if (cached != null) {
      prices[coinId] = cached;
    } else {
      idsToFetch.push(coinId);
    }
  }

  // Nothing to fetch
  if (!idsToFetch.length) return prices;

  try {
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: idsToFetch.join(","), // e.g. "bitcoin,ethereum,solana"
          vs_currencies: "usd",
        },
        timeout: 5000,
      }
    );

    idsToFetch.forEach((coinId) => {
      if (data[coinId] && data[coinId].usd != null) {
        const price = data[coinId].usd;
        prices[coinId] = price;
        priceCache.set(coinId, price);
      } else {
        console.warn(`Price not found for coin: ${coinId}`);
      }
    });
  } catch (err) {
    // If CoinGecko rate limits or fails, we just log and let caller decide
    if (err.response && err.response.status === 429) {
      console.error("CoinGecko rate limit hit (429 Too Many Requests)");
      throw new Error("RATE_LIMIT");
    }
    console.error("Error fetching prices from CoinGecko:", err.message);
    throw new Error("PRICE_FETCH_FAILED");
  }

  return prices;
};

// ✅ Add holding
const addHolding = async (req, res) => {
  try {
    const { coinName, quantity, buyPrice } = req.body;

    if (!coinName || !quantity || !buyPrice) {
      return res.status(400).json({
        message: "coinName, quantity and buyPrice are required",
        success: false,
      });
    }

    const newHolding = new Holding({
      userId: req.user._id,
      coinName,
      quantity: toNumber(quantity),
      buyPrice: toNumber(buyPrice),
    });

    await newHolding.save();

    return res.status(201).json({
      message: "Holding added!",
      success: true,
    });
  } catch (err) {
    console.error("Add Holding Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// ✅ Get all holdings of a user
const getHoldings = async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ holdings, success: true });
  } catch (err) {
    console.error("Get Holdings Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// ✅ Optimized portfolio stats with batching + cache + rate limit handling
const getPortfolioStats = async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id });

    if (!holdings.length) {
      return res.status(200).json({
        totalInvestment: 0,
        totalCurrentValue: 0,
        totalProfitLoss: 0,
        portfolioDetails: [],
        success: true,
      });
    }

    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;
    const portfolioDetails = [];

    // 1️⃣ Collect unique coin IDs (CoinGecko uses lowercase IDs)
    const allCoinIds = holdings.map((h) =>
      (h.coinName || "").toLowerCase().trim()
    );
    const uniqueCoinIds = [...new Set(allCoinIds)].filter(Boolean);

    let prices = {};
    try {
      // 2️⃣ Fetch all missing prices in one call (plus cache)
      prices = await fetchPricesForCoins(uniqueCoinIds);
    } catch (error) {
      if (error.message === "RATE_LIMIT") {
        return res.status(503).json({
          success: false,
          message:
            "Live price API limit reached. Please try again after some time.",
        });
      }

      console.error("Price fetch error:", error.message);
      // We will fall back to using buyPrice only
    }

    // 3️⃣ Calculate stats
    for (const holding of holdings) {
      const coinId = (holding.coinName || "").toLowerCase().trim();

      const quantity = toNumber(holding.quantity);
      const buyPrice = toNumber(holding.buyPrice);

      // If price not available, fall back to buyPrice (no live P/L, but app still works)
      const currentPrice =
        prices[coinId] != null && !Number.isNaN(prices[coinId])
          ? prices[coinId]
          : buyPrice;

      const investment = quantity * buyPrice;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - investment;

      totalInvestment += investment;
      totalCurrentValue += currentValue;
      totalProfitLoss += profitLoss;

      portfolioDetails.push({
        coinName: holding.coinName,
        currentPrice,
        quantity,
        buyPrice,
        investment,
        currentValue,
        profitLoss,
      });
    }

    return res.status(200).json({
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      portfolioDetails,
      success: true,
    });
  } catch (err) {
    console.error("getPortfolioStats Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// ✅ Delete holding (only if belongs to user)
const deleteHolding = async (req, res) => {
  try {
    const holdingId = req.params.id;

    const deletedHolding = await Holding.findOneAndDelete({
      _id: holdingId,
      userId: req.user._id,
    });

    if (!deletedHolding) {
      return res.status(404).json({
        message: "Holding not found or not authorized",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Holding deleted successfully",
      success: true,
    });
  } catch (err) {
    console.error("Delete Holding Error:", err);
    return res.status(400).json({
      message: "Holding cannot be deleted",
      success: false,
    });
  }
};

// ✅ Update holding (only if belongs to user)
const updateHoldings = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity == null) {
      return res.status(400).json({
        message: "Quantity is required",
        success: false,
      });
    }

    const updatedHolding = await Holding.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { quantity: toNumber(quantity) },
      { new: true }
    );

    if (!updatedHolding) {
      return res.status(404).json({
        message: "Holding not found or not authorized",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Holding updated",
      success: true,
      updatedHolding,
    });
  } catch (err) {
    console.error("Update Holding Error:", err);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

module.exports = {
  addHolding,
  getHoldings,
  getPortfolioStats,
  deleteHolding,
  updateHoldings,
};
