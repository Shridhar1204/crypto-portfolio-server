const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./Models/db");
const AuthRouter = require("./Routes/AuthRouter");
const HoldingRouter = require("./Routes/HoldingRouter");

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Use basic CORS setup (open it for now to test)
app.use(cors({
  origin: '*', // Allow all origins temporarily to check CORS works
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use("/auth", AuthRouter);
app.use("/holdings", HoldingRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
