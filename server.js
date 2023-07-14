require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { logger } = require("./middleware/logger");
const { logEvents } = require("./middleware/logger");
// models
const Log = require("./models/logModel");
//config
const connectDB = require("./config/connectDB");
//schedule API call and keepserverActive
const axios = require("axios");
const nodeCron = require("node-cron");

const router = require("express").Router();
const nodemailer = require("nodemailer");

//nodeCron routes

//const logRoute = require("./HPNotePad/routes/logRoute");
//const dataRoute = require("./HPNotePad/routes/dataRoute");

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
//app.use("/log", logRoute);
//app.use("/notepad/data", dataRoute);

// function keepServerActive() {
//   nodeCron.schedule("*/10 * * * *", async function logUpdateToServer() {
//     console.log("Scheduling a new log update.");
//     try {
//       await axios.post("https://nodecronserver.onrender.com/log");
//       console.log("Log update sent.");
//     } catch (error) {
//       console.log("Error during log update.");
//       if (error.response) {
//         console.log("The request was made and the server responded with a status code not in the 2xx range.");
//         console.log("Error data: ", error.response.data);
//         console.log("Error status: ", error.response.status);
//         console.log("Error headers: ", error.response.headers);
//       } else if (error.request) {
//         console.log("The request was made but no response was received.");
//         console.log("Request: ", error.request);
//       } else {
//         console.log("Something happened in setting up the request that triggered an Error.");
//         console.log("Error message: ", error.message);
//       }
//     }
//   });
// }

function keepServerActive() {
  nodeCron.schedule("*/10 * * * *", async function logUpdateToServer() {
    console.log("Scheduling a new log update.");
    let date = new Date();
    console.log("Creating a new log at: ", date);
  
    const log = await Log.create({
      date,
    });
  
    if (!log) {
      console.log("Error creating log at: ", date);
      res.status(400);
      throw new Error("Invalid log data");
    } else {
      console.log("log created at: ", date);
    }
  
    const createdLog = await log.save();
    console.log("Log saved at: ", date);
    res.status(201).json(createdLog);
  });
}

keepServerActive()



// function nodeMailerTest() {
//   nodeCron.schedule("*/1 * * * *", () => {
//     console.log("NodeMailerTest triggered");
//     let date = new Date();

//     let smtpTransporter = nodemailer.createTransport({
//       service: "Gmail",
//       port: 465,
//       auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS,
//       },
//     });
//     let mailOptions = {
//       from: process.env.GMAIL_USER,
//       to: process.env.GMAIL_USER,
//       subject: `nodecronServer triggered at ${date}`,
//       html: `
//       <h3>Successful trigger at ${date}</h3>

//      `,
//     };
  
//     smtpTransporter.sendMail(mailOptions, (error) => {
//       if (error) {
//         console.error("Failed to send mail:", error);
//       } else {
//         console.log("Success email sent");
//       }
//     });
//   });
// }

function nodeMailerConfirmationEmail(source, responseData) {

    console.log("NodeMailerTest triggered");
    let date = new Date();

    let smtpTransporter = nodemailer.createTransport({
      service: "Gmail",
      port: 465,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    let mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `nodecronServer - ${source} - triggered at ${date}`,
      html: `
      <h3>Successful trigger at ${date}</h3>
      <h3>Source  ${source}</h3>
      ${responseData ? `<p>Response data: ${JSON.stringify(responseData)}</p>` : ""}

     `,
    };
  
    smtpTransporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Failed to send mail:", error);
      } else {
        console.log("Success email sent");
      }
    });
  
}

// nodeMailerTest()

function nodeCron1WithConfirmationEmail() {
  nodeCron.schedule("*/1 * * * *", () => {
    console.log("NodeCron1 triggered");
    let date = new Date();
    nodeMailerConfirmationEmail("nodeCron1")
  });
};

function nodeCron2WithConfirmationEmail() {
  nodeCron.schedule("*/1 * * * *", () => {
    console.log("NodeCron2 triggered");
    let date = new Date();
    nodeMailerConfirmationEmail("nodeCron2")
  });
};

//nodeCron1WithConfirmationEmail()
//nodeCron2WithConfirmationEmail()

function scheduledAPICall() {
 nodeCron.schedule("0 7 * * * ", async function logUpdateToServer() {
  //nodeCron.schedule("*/1 * * * *", async function logUpdateToServer() {
    try {
      const response = await axios.post("https://cute-gray-pelican-tux.cyclic.app/notepad/data");
      console.log('Response from server:', response.data);
      nodeMailerConfirmationEmail("HPNotepad", response.data);
    } catch (error) {
      console.log("Error within scheduledAPICall");
      console.log(error)
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log("Error", error.message);
      }
    }
  });
}


scheduledAPICall()

const port = process.env.PORT || 5000;
app.listen(port, console.log(`server listing to port 5000 only`));
