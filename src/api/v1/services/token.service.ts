import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/user";
import VaultManager from "./vault-manager";
export class TokenService {
  constructor() {}

  public static async verifyAccessToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const bearerToken = req.headers?.authorization;
    if (!bearerToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const accessToken = bearerToken.substring(7);
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const vaultManager = VaultManager.getInstance();
      const accessSecret = await vaultManager.read("secret/data/accessSecret");
      const tokenData = jwt.verify(accessToken, accessSecret.publicKey);
      req.user = tokenData as User;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  async getAccessToken(data: User): Promise<string | undefined> {
    const vaultManager = VaultManager.getInstance();
    const accessSecret = await vaultManager.read("secret/data/accessSecret");
    const token = jwt.sign(data, accessSecret.privateKey, {
      algorithm: "RS256",
      expiresIn: "8h",
      audience: data._id,
      issuer: "khishigee.mn"
    });
    return token;
  }
}
