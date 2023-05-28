require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { logger } = require("./middleware/logger");
const { logEvents } = require("./middleware/logger");
//config
const connectDB = require("./config/connectDB");
//schedule API call and keepserverActive
const axios = require("axios");
const nodeCron = require("node-cron");

//nodeCron routes

const logRoute = require("./HPNotePad/routes/logRoute");
const dataRoute = require("./HPNotePad/routes/dataRoute");

const app = express();


//Connect to Mongo DB
connectDB();

//custom middleware logger
app.use(logger);
mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});

app.use("/", express.static(path.resolve(path.join(__dirname, "./build"))));

app.use(express.json());
const whitelist = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://hpnotepad.onrender.com",
  "https://fantasticfy.onrender.com",
  "https://patrickobrien.onrender.com",
  "https://bcnminimalista.onrender.com",
  "https://nodecronserver.onrender.com"
];
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('Origin: ', origin); // Log the origin
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

//routes
app.use("/log", logRoute);
app.use("/notepad/data", dataRoute);

function keepServerActive() {
  nodeCron.schedule("*/10 * * * *", async function logUpdateToServer() {
    console.log("Scheduling a new log update.");
    try {
      await axios.post("https://nodecronserver.onrender.com/log");
      console.log("Log update sent.");
    } catch (error) {
      console.log("Error during log update.");
      if (error.response) {
        console.log("The request was made and the server responded with a status code not in the 2xx range.");
        console.log("Error data: ", error.response.data);
        console.log("Error status: ", error.response.status);
        console.log("Error headers: ", error.response.headers);
      } else if (error.request) {
        console.log("The request was made but no response was received.");
        console.log("Request: ", error.request);
      } else {
        console.log("Something happened in setting up the request that triggered an Error.");
        console.log("Error message: ", error.message);
      }
    }
  });
}

keepServerActive()

function scheduledAPICall() {
  nodeCron.schedule("0 7 * * * ", function logUpdateToServer() {
    try {
      axios.post("https://nodecronserver.onrender.com/notepad/data");
      // axios.post("http://localhost:5000/notepad/data");
    } catch (error) {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log("Error", error.message);
      }
      console.log("error within scheduledAPICall");
    }
  });
}


scheduledAPICall()

const port = process.env.PORT || 5000;
app.listen(port, console.log(`server listing to port 5000 only`));
