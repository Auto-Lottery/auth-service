import UserModel from "../models/user.model";
import { CustomResponse } from "../types/custom-response";
import { User } from "../types/user";
import { errorLog } from "../utilities/log";

export class UserService {
  constructor() {}

  async getAllUsers(operator?: string): Promise<CustomResponse<User[]>> {
    try {
      if (operator) {
        const users = await UserModel.find({
          operator: operator
        });
        return {
          code: 200,
          data: users.map((item) => item.toJSON({ virtuals: true }))
        };
      }
      const users = await UserModel.find();
      return {
        code: 200,
        data: users.map((item) => item.toJSON({ virtuals: true }))
      };
    } catch (err) {
      errorLog("Get all users err::: ", err);
      return {
        code: 500,
        message: "Алдаа гарлаа"
      };
    }
  }

  async getUserList(page: number, pageSize: number, sortBy?: string) {
    try {
      const skip = (page - 1) * pageSize;
      const users = await UserModel.find()
        .skip(skip)
        .limit(pageSize)
        .sort({
          [sortBy || "_id"]: -1
        })
        .exec();
      const total = await UserModel.countDocuments();
      return {
        userList: users,
        total
      };
    } catch (error) {
      errorLog("User list fetch error ", error);
      throw new Error(`User list fetch error`);
    }
  }
}
