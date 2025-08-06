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
const allowedOrigins = ['http://localhost:5173','https://crypto-portfolio-new.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));


app.use('/auth', AuthRouter);
app.use('/holdings', HoldingRouter);


app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
