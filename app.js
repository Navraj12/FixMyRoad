import express from "express";
const app = express();
import dotenv from "dotenv";
import connectDatabase from "./database/db.js";

dotenv.config();

//Routes

import authRoute from "./routes/authRoute.js";

//end routes

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//telling nodejs to give access to the uploads folder
app.use(express.static("uploads"));
import cors from "cors";
app.use(
  cors({
    origin: "*",
  })
);

connectDatabase();
app.get("/", (req, res) => {
  res.status(200).json({
    message: "I am here",
  });
});

app.use("/api/auth", authRoute);

// listen server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server has started at PORT ${PORT}`);
});
