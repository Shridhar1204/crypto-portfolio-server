const express = require("express");
const cors = require("cors");
require('dotenv').config();
require('./Models/db');
const bodyParser = require("body-parser")
const AuthRouter = require('./Routes/AuthRouter');
const HoldingRouter = require('./Routes/HoldingRouter');

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: "https://crypto-portfolio-client.vercel.app/",
  credentials: true
}));


app.use('/auth', AuthRouter);
app.use('/holdings', HoldingRouter);


app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});