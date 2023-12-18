import { generateKeyPairSync } from "crypto";
import { OTP_DURATION } from "../config";
import UserModel from "../models/user.model";
import { CustomResponse, CustomResponseError } from "../types/custom-response";
import { LoginData, User, UserWithToken } from "../types/user";
import { checkPhonenumber, generateOTP } from "../utilities";
import { TokenService } from "./token.service";
import { RedisManager } from "./redis-manager";
import VaultManager from "./vault-manager";
import { errorLog } from "../utilities/log";
import mongoose from "mongoose";
import { transactional } from "../config/mongodb";

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
    otpCode
  }: LoginData): Promise<CustomResponse<UserWithToken>> {
    try {
      const res = checkPhonenumber(phoneNumber);

      if (res.code === 500) {
        return res;
      }
      const pn = res.data.phoneNumber;
      const otp = await this.redisManager.getClient()?.get(pn);
      if (!otp || otp !== otpCode) {
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
          accessToken
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
}
