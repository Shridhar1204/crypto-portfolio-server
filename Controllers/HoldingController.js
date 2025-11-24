const axios = require("axios");
const NodeCache = require("node-cache");
const Holding = require("../Models/Holding");

// 🔹 Cache for CoinLore tickers (all coins list) for 5 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ✅ Safely convert to number
const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

// ✅ Fetch all tickers from CoinLore (cached)
// Docs: GET https://api.coinlore.net/api/tickers/?start=0&limit=100
// You can increase limit if you use many different coins.
const fetchCoinLoreTickers = async () => {
  const cached = cache.get("coinlore_tickers");
  if (cached) return cached;

  try {
    const res = await axios.get(
      "https://api.coinlore.net/api/tickers/",
      {
        params: {
          start: 0,
          limit: 200, // top 200 coins should be plenty for your app
        },
        timeout: 5000,
      }
    );

    const list = res.data.data || res.data || [];
    cache.set("coinlore_tickers", list);
    return list;
  } catch (err) {
    console.error("Error fetching tickers from CoinLore:", err.message);
    // if API fails, just return empty -> we'll fall back to buyPrice
    return [];
  }
};

// ✅ Find a ticker by user-entered coin name/symbol
// - supports "BTC", "btc", "Bitcoin", "bitcoin", "eth", "Ethereum", etc.
const findTickerForHolding = (tickers, coinNameRaw) => {
  if (!coinNameRaw) return null;

  const nameTrimmed = coinNameRaw.trim();
  const symbolUpper = nameTrimmed.toUpperCase();
  const nameLower = nameTrimmed.toLowerCase();

  // 1) try match by symbol (BTC, ETH, SOL, etc.)
  let ticker =
    tickers.find(
      (t) => (t.symbol || "").toUpperCase() === symbolUpper
    ) || null;

  if (ticker) return ticker;

  // 2) try match by name (Bitcoin, Ethereum, Solana...)
  ticker =
    tickers.find(
      (t) => (t.name || "").toLowerCase() === nameLower
    ) || null;

  return ticker;
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
      coinName, // keep whatever user typed: "ETH", "eth", "Ethereum", etc.
      quantity: toNumber(quantity),
      buyPrice: toNumber(buyPrice),
    });

    await newHolding.save();

    return res.status(201).json({
      message: "Holding added!",
      success: true,
      holding: newHolding,
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

// ✅ Portfolio stats using CoinLore + cache + safe fallback
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

    // 1️⃣ Get latest tickers from CoinLore (with cache)
    const tickers = await fetchCoinLoreTickers();

    // 2️⃣ Calculate stats per holding
    for (const holding of holdings) {
      const quantity = toNumber(holding.quantity);
      const buyPrice = toNumber(holding.buyPrice);

      // Try to find matching ticker for this holding
      const ticker = findTickerForHolding(tickers, holding.coinName);

      let currentPrice = buyPrice; // fallback
      let source = "buyPrice";

      if (ticker && ticker.price_usd != null) {
        const parsed = parseFloat(ticker.price_usd);
        if (!Number.isNaN(parsed)) {
          currentPrice = parsed;
          source = "coinlore";
        }
      }

      const investment = quantity * buyPrice;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - investment;

      totalInvestment += investment;
      totalCurrentValue += currentValue;
      totalProfitLoss += profitLoss;

      portfolioDetails.push({
        coinName: holding.coinName, // what user sees
        symbol: ticker ? ticker.symbol : null,
        coinloreId: ticker ? ticker.id : null,
        priceSource: source, // "coinlore" or "buyPrice"
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
