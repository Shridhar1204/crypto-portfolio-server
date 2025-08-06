const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./Models/db");
const bodyParser = require("body-parser");

const AuthRouter = require("./Routes/AuthRouter");
const HoldingRouter = require("./Routes/HoldingRouter");

const PORT = process.env.PORT || 8080;
const app = express();

// ✅ Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://crypto-portfolio-new.vercel.app",
  "https://crypto-portfolio-client.vercel.app"  // Add this if you're deploying frontend here
];

// ✅ Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// ✅ Apply CORS once only
app.use(cors(corsOptions));

// ✅ Body parsers
app.use(express.json());
app.use(bodyParser.json());

// ✅ Routes (no colons or typos!)
app.use("/auth", AuthRouter);
app.use("/holdings", HoldingRouter);

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
