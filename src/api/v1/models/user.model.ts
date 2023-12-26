import { Schema, model } from "mongoose";
import { MobileOperator } from "../types/enums";

const UserSchema = new Schema(
  {
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
          MobileOperator.SYSTEM,
          MobileOperator.ONDO,
          MobileOperator.UNKNOWN
        ]
      }
    },
    usingPassword: {
      type: Boolean,
      default: false
    },
    password: {
      type: String
    },
    createdDate: {
      type: Number,
      default: Date.now,
      index: -1
    }
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: false
    },
    virtuals: {
      _id: {
        get() {
          return this._id.toString();
        }
      }
    }
  }
);

const UserModel = model("users", UserSchema);
export default UserModel;
