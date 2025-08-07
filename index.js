const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Use built-in CORS handling — don't manually access req.headers.origin
app.use(cors({
  origin: "https://crypto-portfolio-client.vercel.app", // ✅ Your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

// Sample route
app.post("/auth/login", (req, res) => {
  console.log("Login hit", req.body);
  res.json({ message: "Login successful" });
});

// ✅ Export for Vercel serverless
module.exports = app;
