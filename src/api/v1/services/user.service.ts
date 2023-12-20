import UserModel from "../models/user.model";
import { errorLog } from "../utilities/log";

export class UserService {
  constructor() {}

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
