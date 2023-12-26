import express from "express";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
const authRoutes = express.Router();

authRoutes.post("/sendOTPCode", async (req, res) => {
  try {
    const authService = new AuthService();
    const response = await authService.sendOTPCode(req.body);
    res.send(response);
  } catch (err) {
    res.status(500).json(err);
  }
});

authRoutes.post("/login", async (req, res) => {
  try {
    const authService = new AuthService();
    const response = await authService.login(req.body);
    res.send(response);
  } catch (err) {
    res.status(500).json(err);
  }
});

authRoutes.post(
  "/createPassword",
  TokenService.verifyAccessToken,
  async (req, res) => {
    try {
      const authService = new AuthService();
      const response = await authService.createPassword(req.body);
      res.send(response);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

authRoutes.post("/register", async (req, res) => {
  try {
    const authService = new AuthService();
    const response = await authService.register(req.body?.phoneNumber);
    res.send(response);
  } catch (err) {
    res.status(500).json(err);
  }
});

authRoutes.get("/verifyToken", TokenService.verifyAccessToken, (req, res) => {
  if (req?.user) {
    return res.send(req.user);
  }
  return res.status(401).json({ message: "Unauthorized" });
});

export default authRoutes;
