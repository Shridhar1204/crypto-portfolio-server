const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./Models/db");

const AuthRouter = require("./Routes/AuthRouter");
const HoldingRouter = require("./Routes/HoldingRouter");

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Always set CORS *before* any routes or middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://crypto-portfolio-client.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // ✅ Respond to preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // No Content
  }

  next();
});

app.use(bodyParser.json());
app.use(express.json());

app.use("/auth", AuthRouter);
app.use("/holdings", HoldingRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
