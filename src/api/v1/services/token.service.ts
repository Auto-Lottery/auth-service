import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config";
import { User } from "../types/user";
import { errorLog } from "../utilities/log";
export class TokenService {
  constructor() {}

  public static verifyAccessToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const bearerToken = req.headers?.["authorization"];
    if (!bearerToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const accessToken = bearerToken.substring(7);
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const tokenData = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
      errorLog("TOKEN DATA::: ", tokenData);
      req.user = tokenData as User;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  getAccessToken(data: User): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        data,
        ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h"
        },
        (err, token) => {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
  }
}
