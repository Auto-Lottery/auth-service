import UserModel from "../models/user.model";
import { CustomResponse } from "../types/custom-response";
import { errorLog } from "../utilities/log";
import { Filter, generateQuery } from "../utilities/mongo";

export class UserService {
  constructor() {}

  async getAllUsersPhoneNumber(
    page: number = 1,
    pageSize: number = 100,
    operator?: string
  ): Promise<CustomResponse<{ total: number; phoneNumberList: string[] }>> {
    try {
      const skip = (page - 1) * pageSize;
      let filter = {};
      if (operator) {
        filter = {
          operator
        };
      }
      const users = await UserModel.find(filter, "phoneNumber")
        .skip(skip)
        .limit(pageSize)
        .sort({
          _id: -1
        });
      const total = await UserModel.countDocuments(filter);
      return {
        code: 200,
        data: {
          phoneNumberList: users.map((item) => item.phoneNumber),
          total
        }
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
