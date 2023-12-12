import { Schema, model } from "mongoose";
import { MobileOperator } from "../types/enums";

const UserSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    lowerCase: true
  },
  operator: {
    type: String,
    required: true,
    enum: {
      values: [
        MobileOperator.MOBICOM,
        MobileOperator.UNITEL,
        MobileOperator.SKYTEL,
        MobileOperator.GMOBILE,
        MobileOperator.ONDO,
        MobileOperator.UNKNOWN
      ]
    }
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const UserModel = model("users", UserSchema);
export default UserModel;
