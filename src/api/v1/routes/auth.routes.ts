import express from "express";
import { AuthService } from "../services/auth.service";
const authRoutes = express.Router();

authRoutes.post("/sendOTPCode", async (req, res) => {
  const authService = new AuthService();
  const response = await authService.sendOTPCode(req.body);
  res.send(response);
});

authRoutes.post("/login", async (req, res) => {
  const authService = new AuthService();
  const response = await authService.login(req.body);
  res.send(response);
});

authRoutes.post("/register", async (req, res) => {
  const authService = new AuthService();
  const response = await authService.register(req.body?.phoneNumber);
  res.send(response);
});

export default authRoutes;
