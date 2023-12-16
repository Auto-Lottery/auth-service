import { config } from "dotenv";
config();

const PORT = Number(process.env.PORT || "5000");
const OTP_DURATION = Number(process.env.OTP_DURATION || "90");
const OTP_SECRET = process.env.OTP_SECRET || "";
const VAULT_TOKEN = process.env.VAULT_TOKEN || "";
const VAULT_URL = process.env.VAULT_URL || "";
const isDev = process.env.NODE_ENV !== "production";

export { PORT, OTP_DURATION, OTP_SECRET, VAULT_TOKEN, VAULT_URL, isDev };
