const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./Models/db");
const bodyParser = require("body-parser");

const AuthRouter = require("./Routes/AuthRouter");
const HoldingRouter = require("./Routes/HoldingRouter");

const PORT = process.env.PORT || 8080;
const app = express();

// ✅ CORRECT CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "https://crypto-portfolio-client.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed from this origin"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ Use CORS before anything else
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // <-- preflight requests handler

app.use(bodyParser.json());
app.use(express.json());

app.use("/auth", AuthRouter);
app.use("/holdings", HoldingRouter);

app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
});
