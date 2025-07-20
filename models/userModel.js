import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userEmail: {
      type: String,
      required: [true, "userEmail must be provided"],
      unique: true,
      lowercase: true,
    },
    userPhoneNumber: {
      type: String,
      required: [true, "userPhoneNumber must be provided"],
    },
    userName: {
      type: String,
      required: [true, "userName must be provided"],
    },
    userPassword: {
      type: String,
      required: [true, "userPasssword must be provided"],
      // select : false,
      minlength: 8,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
