import { totp } from "otplib";
import { OTP_DURATION, OTP_SECRET } from "../config";
import { MobileOperator } from "../types/enums";
import { CustomResponse } from "../types/custom-response";

export const generateOTP = (length: number, duration?: number): string => {
  let additionalOption = {};
  if (duration) {
    const expiresTimestamp = Date.now() + OTP_DURATION * 1000;
    additionalOption = {
      epoch: expiresTimestamp
    };
  }
  totp.options = {
    ...additionalOption,
    digits: length
  };

  return totp.generate(OTP_SECRET);
};

export const getMobileOperator = (phoneNumber: string) => {
  const prefix = phoneNumber.substring(0, 2);
  switch (prefix) {
    case "99":
    case "95":
    case "94":
    case "85":
    case "75":
      return MobileOperator.MOBICOM;
    case "96":
    case "91":
    case "90":
    case "76":
      return MobileOperator.SKYTEL;
    case "89":
    case "88":
    case "86":
    case "80":
    case "77":
      return MobileOperator.UNITEL;
    case "98":
    case "97":
    case "93":
    case "83":
    case "78":
      return MobileOperator.GMOBILE;
    case "66":
    case "60":
      return MobileOperator.ONDO;
    default:
      return MobileOperator.UNKNOWN;
  }
};

export const checkPhonenumber = (
  phoneNumber: string
): CustomResponse<{ phoneNumber: string; operator: MobileOperator }> => {
  const pn = phoneNumber.trim();
  if (pn.length !== 8) {
    return {
      code: 500,
      message: "Утасны дугаарын формат буруу байна"
    };
  }
  const phoneNumberRegex = /\d{8}/;
  if (!phoneNumberRegex.test(pn)) {
    return {
      code: 500,
      message: "Утасны дугаарын формат буруу байна"
    };
  }
  const operator = getMobileOperator(pn);

  if (operator === MobileOperator.UNKNOWN) {
    return {
      code: 500,
      message: "Утасны дугаарын формат буруу байна"
    };
  }

  return {
    code: 200,
    data: {
      phoneNumber: pn,
      operator
    }
  };
};
