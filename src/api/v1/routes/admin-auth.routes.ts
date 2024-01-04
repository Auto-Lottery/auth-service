import express from "express";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
import { AdminUser } from "../types/user";
import { UserService } from "../services/user.service";
import { errorLog } from "../utilities/log";
import { AdminService } from "../services/admin.service";

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
      errorLog("Admin register err::: ", err);
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

adminAuthRoutes.get(
  "/verifyToken",
  TokenService.verifyAdminAccessToken,
  (req, res) => {
    if (req?.user) {
      return res.send(req.user);
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
);

adminAuthRoutes.post(
  "/users",
  TokenService.verifyAdminAccessToken,
  async (req, res) => {
    const filter = req.body;
    if (req?.user) {
      try {
        const userService = new UserService();
        const userRes = await userService.getUserList(filter);

        return res.status(200).json({
          code: 200,
          data: userRes
        });
      } catch (err) {
        errorLog("GET USER LIST::: ", err);
        return res.status(500).json(err);
      }
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
);

adminAuthRoutes.post(
  "/adminUsers",
  TokenService.verifyAdminAccessToken,
  async (req, res) => {
    const filter = req.body;
    if (req?.user) {
      try {
        const adminService = new AdminService();
        const adminRes = await adminService.getAdminUserList(filter);

        return res.status(200).json({
          code: 200,
          data: adminRes
        });
      } catch (err) {
        errorLog("GET ADMIN USER LIST::: ", err);
        return res.status(500).json(err);
      }
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
);

adminAuthRoutes.get(
  "/allUsersPhoneNumber",
  TokenService.verifyAdminAccessToken,
  async (req, res) => {
    const { page, pageSize, operator } = req.query;
    if (req?.user) {
      try {
        const userService = new UserService();
        const usersData = await userService.getAllUsersPhoneNumber(
          (page || 1) as number,
          (pageSize || 100) as number,
          operator as string
        );
        return res.send(usersData);
      } catch (err) {
        errorLog("GET ALL USER LIST::: ", err);
        return res.status(500).json(err);
      }
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
);

adminAuthRoutes.post(
  "/bulkRegisterUsers",
  TokenService.verifyAdminAccessToken,
  async (req, res) => {
    const { phoneNumberList } = req.body;
    const adminService = new AdminService();
    phoneNumberList.map((pn: string) => {
      adminService.registerRequestSentToQueue(pn);
    });
    return res.send({
      code: 200,
      data: true
    });
  }
);
export default adminAuthRoutes;
