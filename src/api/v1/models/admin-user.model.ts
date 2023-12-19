import { Schema, model } from "mongoose";
import { MobileOperator } from "../types/enums";

const AdminUserSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true
    },
    password: {
      type: String,
      required: true
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
    roles: {
      type: [String],
      default: "supervisor",
      enum: {
        values: ["supervisor", "admin"]
      }
    },
    createdDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

const AdminUserModel = model("admin-user", AdminUserSchema);
export default AdminUserModel;