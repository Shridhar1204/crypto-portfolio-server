const express = require("express");
const cors = require("cors");
require('dotenv').config();
require('./Models/db');
const bodyParser = require("body-parser");
const AuthRouter = require('./Routes/AuthRouter');
const HoldingRouter = require('./Routes/HoldingRouter');

const PORT = process.env.PORT || 8080;

const app = express();


// ✅ Set up CORS
app.use(cors({origin:'https://crypto-portfolio-client.vercel.app'}))

// other middlewares
app.use(express.json());
app.use(bodyParser.json());

// routes
app.use('/auth', AuthRouter);
app.use('/holdings', HoldingRouter);

const listEndpoints = require('express-list-endpoints');
console.log(listEndpoints(app));


app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
