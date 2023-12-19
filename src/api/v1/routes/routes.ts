import express from "express";
import testRoutes from "./test.routes";
import authRoutes from "./auth.routes";
import adminAuthRoutes from "./admin-auth.routes";
const V1Routes = express.Router();

V1Routes.get("/", (req, res) => {
  res.send({
    data: "v1"
  });
});

V1Routes.use("/test", testRoutes);
V1Routes.use("/auth", authRoutes);
V1Routes.use("/admin", adminAuthRoutes);

export default V1Routes;
