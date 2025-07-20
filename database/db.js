import mongoose from "mongoose";

const connectDatabase = () => {
  mongoose.connect(process.env.DATABASE_URL);
  console.log("Database connected successfully");
};

export default connectDatabase;
