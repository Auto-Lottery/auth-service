import { generateKeyPairSync } from "crypto";
import { OTP_DURATION } from "../config";
import { redisClient } from "../config/redis";
import UserModel from "../models/user.model";
import { CustomResponse, CustomResponseError } from "../types/custom-response";
import { LoginData, User, UserWithToken } from "../types/user";
import { checkPhonenumber, generateOTP } from "../utilities";
import { TokenService } from "./token.service";
import { vaultClient } from "../config/vault";

export class AuthService {
  private tokenService;
  constructor() {
    this.tokenService = new TokenService();
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
      const oldOtp = await redisClient.get(pn);
      if (oldOtp) {
        const ttl = await redisClient.ttl(pn);
        return {
          code: 200,
          data: {
            ttl,
            status: oldOtp
          }
        };
      }

      // Shineer code uusgene
      const otp = generateOTP(4, OTP_DURATION);
      redisClient.set(pn, otp);
      redisClient.expire(pn, OTP_DURATION);
      // Send code use sms
      return {
        code: 200,
        data: {
          ttl: OTP_DURATION,
          status: otp
        }
      };
    } catch (err) {
      console.log("SENDCODE ERR::: ", err);
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

      const otp = await redisClient.get(pn);
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
        }
        return res as CustomResponseError;
      }

      userData = foundUser?.toJSON();

      //token eneter uusgene
      const accessToken = await this.tokenService.getAccessToken(userData);

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
      console.log("LOGIN ERR::: ", err);
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

      const newUser = new UserModel(res.data);

      const user = await newUser.save();

      await this.createUserPemKeys(user._id.toString());
      return {
        code: 200,
        data: user.toJSON()
      };
    } catch (err) {
      console.log("REGISTER ERR::: ", err);
      throw new Error("INTERNAL SERVER ERROR");
    }
  }

  async createUserPemKeys(userId: string) {
    try {
      const { publicKey, privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem"
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
          cipher: "aes-256-cbc",
          passphrase: "top secret"
        }
      });
      // ene hesgiig queue-ruu hiine
      await vaultClient.write(`secret/data/${userId}`, {
        data: { publicKey, privateKey }
      });
    } catch (err) {
      console.log("CREATE USER KEYS ERR::: ", err);
      throw Error("INTERNAL SERVER ERROR");
    }
  }
}
