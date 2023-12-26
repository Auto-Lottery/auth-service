import UserModel from "../models/user.model";
import { CustomResponse } from "../types/custom-response";
import { User } from "../types/user";
import { errorLog } from "../utilities/log";
import { Filter, generateQuery } from "../utilities/mongo";

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

  async getUserList(filter: Filter) {
    const { field, order } = filter?.sort || {
      field: "_id",
      order: "desc"
    };
    const { page, pageSize } = filter?.pagination || {
      page: 1,
      pageSize: 10
    };
    try {
      const skip = (page - 1) * pageSize;
      const query = generateQuery(filter?.conditions || []);

      const users = await UserModel.find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({
          [field]: order === "desc" ? -1 : 1
        });
      const count = await UserModel.countDocuments(query);
      return {
        userList: users,
        total: count
      };
    } catch (error) {
      errorLog("User list fetch error ", error);
      throw new Error(`User list fetch error`);
    }
  }
}
