const mongoose = require("mongoose");

const HoldingSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    coinName: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      required: true,
    },
    buyPrice: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  });
  
  const Holding = mongoose.model("Holding", HoldingSchema);

  module.exports = Holding;