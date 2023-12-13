import express from "express";
import { AuthService } from "../services/auth.service";
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

authRoutes.post("/register", async (req, res) => {
  try {
    const authService = new AuthService();
    const response = await authService.register(req.body?.phoneNumber);
    res.send(response);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default authRoutes;
