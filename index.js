const express = require("express");
const cors = require("cors");
require('dotenv').config();
require('./Models/db');
const bodyParser = require("body-parser");
const AuthRouter = require('./Routes/AuthRouter');
const HoldingRouter = require('./Routes/HoldingRouter');

const PORT = process.env.PORT || 8080;

const app = express();

// ✅ Handle preflight requests manually to avoid path-to-regexp crash
app.options('*', (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://crypto-portfolio-client.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// ✅ Set up CORS
app.use(cors({
  origin: "https://crypto-portfolio-client.vercel.app",
  credentials: true
}));

// other middlewares
app.use(express.json());
app.use(bodyParser.json());

// routes
app.use('/auth', AuthRouter);
app.use('/holdings', HoldingRouter);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
