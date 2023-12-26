import { generateKeyPairSync } from "crypto";
import bcrypt from "bcrypt";
import { OTP_DURATION } from "../config";
import UserModel from "../models/user.model";
import { CustomResponse, CustomResponseError } from "../types/custom-response";
import {
  AdminUser,
  AdminUserWithToken,
  LoginData,
  User,
  UserWithToken
} from "../types/user";
import { checkPhonenumber, generateOTP, hashPassword } from "../utilities";
import { TokenService } from "./token.service";
import { RedisManager } from "./redis-manager";
import VaultManager from "./vault-manager";
import { errorLog } from "../utilities/log";
import mongoose from "mongoose";
import { transactional } from "../config/mongodb";
import AdminUserModel from "../models/admin-user.model";

export class AuthService {
  private tokenService;
  private redisManager;
  private vaultManager;
  constructor() {
    this.tokenService = new TokenService();
    this.redisManager = RedisManager.getInstance();
    this.vaultManager = VaultManager.getInstance();
  }

  async sendOTPCode({ phoneNumber }: { phoneNumber: string }): Promise<
    CustomResponse<{
      ttl: number;
      status: string;
    }>
  > {
    try {
      const res = checkPhonenumber(phoneNumber);
      if (res.code === 500) {
        return res;
      }
      const pn = res.data.phoneNumber;
      // huuchin code uussen esehiig shalgana
      const oldOtp = await this.redisManager.getClient()?.get(pn);
      if (oldOtp) {
        const ttl = await this.redisManager.getClient()?.ttl(pn);
        return {
          code: 200,
          data: {
            ttl: ttl || 0,
            status: oldOtp
          }
        };
      }
      // Shineer code uusgene
      const otp = generateOTP(4, OTP_DURATION);
      await this.redisManager.getClient()?.set(pn, otp);
      await this.redisManager.getClient()?.expire(pn, OTP_DURATION);
      // Send code use sms
      return {
        code: 200,
        data: {
          ttl: OTP_DURATION,
          status: otp
        }
      };
    } catch (err) {
      errorLog("SEND OTP CODE ERR::: ", err);
      throw new Error("INTERNAL SERVER ERROR");
    }
  }

  async login({
    phoneNumber,
    password
  }: LoginData): Promise<CustomResponse<UserWithToken>> {
    try {
      const res = checkPhonenumber(phoneNumber);

      if (res.code === 500) {
        return res;
      }
      const pn = res.data.phoneNumber;

      // Nuuts ugeer newtreh uyd ajillana
      const foundPasswordHasUser = await UserModel.findOne({
        phoneNumber: pn,
        usingPassword: true
      });
      if (foundPasswordHasUser && foundPasswordHasUser?.password) {
        const validate = await bcrypt.compare(
          password,
          foundPasswordHasUser.password
        );

        if (!validate) {
          return {
            code: 500,
            message: "Нууц үг буруу байна!"
          };
        }
        const pHasUser = {
          phoneNumber: foundPasswordHasUser.phoneNumber,
          operator: foundPasswordHasUser.operator,
          createdDate: foundPasswordHasUser.createdDate,
          _id: foundPasswordHasUser._id.toString()
        } as User;
        const accessToken = await this.tokenService.getAccessToken(pHasUser);

        if (!accessToken) {
          return {
            code: 500,
            message: "Нэвтрэхэд алдаа гарлаа"
          };
        }

        return {
          code: 200,
          data: {
            ...pHasUser,
            accessToken: accessToken.token
          }
        };
      }

      // OTP code-r newtreh uyd ajillana
      const otp = await this.redisManager.getClient()?.get(pn);
      if (!otp || otp !== password) {
        return {
          code: 500,
          message: "Нэг удаагийн код буруу байна."
        };
      }

      const foundUser = await UserModel.findOne({
        phoneNumber: pn
      });

      let userData: User;

      if (!foundUser) {
        const res = await this.register(pn);
        if (res.code === 200) {
          userData = res.data;
        } else {
          return res as CustomResponseError;
        }
      } else {
        userData = foundUser.toObject();
      }

      //token eneter uusgene
      const accessToken = await this.tokenService.getAccessToken({
        ...userData,
        _id: userData._id.toString()
      });

      if (!accessToken) {
        return {
          code: 500,
          message: "Нэвтрэхэд алдаа гарлаа"
        };
      }

      return {
        code: 200,
        data: {
          ...userData,
          accessToken: accessToken.token
        }
      };
    } catch (err) {
      errorLog("LOGIN ERR::: ", err);
      throw new Error("INTERNAL SERVER ERROR");
    }
  }

  async register(phoneNumber: string): Promise<CustomResponse<User>> {
    try {
      const res = checkPhonenumber(phoneNumber);

      if (res.code === 500) {
        return res;
      }

      const foundUser = await UserModel.findOne({
        phoneNumber: phoneNumber
      });

      if (foundUser) {
        return {
          code: 200,
          data: foundUser.toJSON()
        };
      }

      const session = await mongoose.startSession();
      const createdUser = await transactional<User>(session, async () => {
        const newUser = new UserModel(res.data);

        const user = await newUser.save({
          session
        });

        await this.createUserPemKeys(user._id.toString());

        return user.toJSON();
      });
      await session.endSession();

      if (createdUser === null) {
        return {
          code: 500,
          message: "Бүртгэл үүсгэхэд алдаа гарлаа."
        };
      }

      return {
        code: 200,
        data: createdUser
      };
    } catch (err) {
      errorLog("REGISTER ERR::: ", err);
      throw new Error("INTERNAL SERVER ERROR");
    }
  }

  async createPassword({
    phoneNumber,
    password,
    confirmPassword
  }: {
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  }) {
    if (password !== confirmPassword) {
      return {
        code: 500,
        message: "Таны баталгаажуулах нууц үг тохирохгүй байна"
      };
    }
    const hp = await hashPassword(password);
    const user = await UserModel.updateOne(
      {
        phoneNumber: phoneNumber
      },
      {
        $set: {
          usingPassword: true,
          password: hp
        }
      }
    );
    if (user.matchedCount === 0) {
      return {
        code: 500,
        message: `${phoneNumber} хэрэглэгч олдсонгүй`
      };
    }
    if (user.matchedCount === 1 && user.modifiedCount === 1) {
      return {
        code: 200,
        data: true
      };
    }
    return {
      code: 200,
      data: false
    };
  }

  async createUserPemKeys(userId: string) {
    try {
      const { publicKey, privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
      });
      if (publicKey && privateKey) {
        await this.vaultManager.write(`secret/data/${userId}`, {
          publicKey,
          privateKey
        });
      } else {
        throw Error("Хэрэглэгчийн нууц түлхүүр үүсгэхэд алдаа гарлаа");
      }
    } catch (err) {
      errorLog("CREATE USER KEYS ERR::: ", err);
      throw Error("INTERNAL SERVER ERROR");
    }
  }

  async registerAdmin({
    phoneNumber,
    password,
    role
  }: {
    phoneNumber: string;
    password: string;
    role?: string;
  }) {
    const res = checkPhonenumber(phoneNumber);

    if (res.code === 500) {
      return res;
    }

    const foundUser = await AdminUserModel.findOne({
      phoneNumber: phoneNumber
    });

    if (foundUser) {
      return {
        code: 500,
        message: "Дугаар бүртгэлтэй байна."
      };
    }

    const hp = await hashPassword(password);
    await AdminUserModel.create({
      ...res.data,
      password: hp,
      role: [role || "supervisor"]
    });

    return {
      code: 200,
      data: true
    };
  }

  async loginAdmin({
    phoneNumber,
    password
  }: {
    phoneNumber: string;
    password: string;
  }): Promise<CustomResponse<AdminUserWithToken>> {
    const res = checkPhonenumber(phoneNumber);

    if (res.code === 500) {
      return res;
    }

    const foundUser = await AdminUserModel.findOne({
      phoneNumber: phoneNumber
    });

    if (!foundUser) {
      return {
        code: 500,
        message: "Бүртгэлгүй байна"
      };
    }

    const validate = await bcrypt.compare(password, foundUser.password);

    if (!validate) {
      return {
        code: 500,
        message: "Нууц үг буруу байна!"
      };
    }

    const accessToken = await this.tokenService.getAccessToken({
      operator: foundUser.operator,
      phoneNumber: foundUser.phoneNumber,
      roles: foundUser.roles,
      createdDate: foundUser.createdDate,
      _id: foundUser._id.toString()
    } as AdminUser);

    return {
      code: 200,
      data: {
        _id: foundUser._id.toString(),
        operator: foundUser.operator,
        phoneNumber: foundUser.phoneNumber,
        roles: foundUser.roles,
        token: accessToken.token,
        exp:
          typeof accessToken.tokenData !== "string"
            ? accessToken.tokenData?.exp
            : undefined
      }
    };
  }
}
