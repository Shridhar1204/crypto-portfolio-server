const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./Models/db");

const AuthRouter = require("./Routes/AuthRouter");
const HoldingRouter = require("./Routes/HoldingRouter");

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Minimal CORS setup — Open access to all for testing
app.use(cors());  // ← THIS must come BEFORE your routes
app.use(express.json());

// ✅ Routes
app.use("/auth", AuthRouter);
app.use("/holdings", HoldingRouter);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
