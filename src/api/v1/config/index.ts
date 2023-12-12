import { config } from "dotenv";
config();

const PORT = Number(process.env.PORT || "5000");
const OTP_DURATION = Number(process.env.OTP_DURATION || "90");
const OTP_SECRET = process.env.OTP_SECRET || "";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
const VAULT_TOKEN = process.env.VAULT_TOKEN || "";
const VAULT_URL = process.env.VAULT_URL || "";

export {
  PORT,
  OTP_DURATION,
  OTP_SECRET,
  ACCESS_TOKEN_SECRET,
  VAULT_TOKEN,
  VAULT_URL
};
