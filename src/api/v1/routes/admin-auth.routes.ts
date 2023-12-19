import express from "express";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
import { AdminUser } from "../types/user";

const adminAuthRoutes = express.Router();

adminAuthRoutes.post(
  "/register",
  TokenService.verifyAdminAccessToken,
  async (req, res) => {
    try {
      const authService = new AuthService();
      const adminUser = req.user as AdminUser;
      if (!adminUser.roles.includes("admin")) {
        return res.status(200).json({
          code: 500,
          message: "Та админ хэрэглэгч үүсгэх эрхгүй байна."
        });
      }
      const response = await authService.registerAdmin(req.body);
      res.send(response);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

adminAuthRoutes.post("/login", async (req, res) => {
  try {
    const authService = new AuthService();
    const response = await authService.loginAdmin(req.body);
    res.send(response);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default adminAuthRoutes;
