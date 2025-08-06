const Holding = require("../Models/Holding");
const axios = require("axios");

//add holding

const addHolding = async (req, res) => {
  try {
    const { coinName, quantity, buyPrice } = req.body;
    const newHolding = new Holding({
      userId: req.user._id,
      coinName,
      quantity,
      buyPrice,
    });

    await newHolding.save();
    res.status(201).json({
      message: "Holding added!",
      success: true,
    });
  } catch (err) {
    console.error("Add Holding Error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//get all holdings of a user

const getHoldings = async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id });

    res.status(200).json({ holdings, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server error",
      success: false,
    });
  }
};

const NodeCache = require('node-cache');
const priceCache = new NodeCache({ stdTTL: 60 }); // Cache TTL: 60 seconds

const getPortfolioStats = async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id });

    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;
    let portfolioDetails = [];

    for (let holding of holdings) {
      const coinId = holding.coinName.toLowerCase();

      // Check if price is in cache
      let currentPrice = priceCache.get(coinId);

      if (!currentPrice) {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
        );

        if (!response.data[coinId]) {
          console.warn(`Price not found for coin: ${coinId}`);
          continue;
        }

        currentPrice = response.data[coinId].usd;

        // Store price in cache
        priceCache.set(coinId, currentPrice);
      }

      const quantity = Number(holding.quantity);
      const buyPrice = Number(holding.buyPrice);

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

    res.status(200).json({
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      portfolioDetails,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};


const deleteHolding = async (req, res) => {
  try {
    const holdingId = req.params.id;
    console.log("Holding ID:", holdingId);
    console.log("User ID from Token:", req.user._id);

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

    res
      .status(200)
      .json({ message: "Holding deleted successfully", success: true });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: "Holding cannot be deleted", success: false });
  }
};

const updateHoldings = async (req, res) => {
  try {
    const { quantity } = req.body;
    const updatedHolding = await Holding.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Holding updated", success: true, updatedHolding });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

//   if you pass { new: true },
// it tells Mongoose:
// “After updating, give me the updated document, not the old one.”

module.exports = {
  addHolding,
  getHoldings,
  getPortfolioStats,
  deleteHolding,
  updateHoldings,
};
