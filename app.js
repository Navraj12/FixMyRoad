import express from "express";
const app = express();
import dotenv from "dotenv";
import connectDatabase from "./database/db.js";

dotenv.config();

//Routes

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
import authRoute from "./routes/authRoute.js";
import locationRoute from "./routes/locationRoute.js";

app.use("/api/auth", authRoute);
app.use("/api/location", locationRoute);

// listen server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server has started at PORT ${PORT}`);
});
