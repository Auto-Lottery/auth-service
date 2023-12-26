import { errorLog } from "../utilities/log";
import { AuthService } from "./auth.service";

export class SystemUser {
  private static token = "";
  constructor() {}

  public static getToken() {
    return this.token;
  }

  public static async login(user: Record<string, string>) {
    try {
      const authService = new AuthService();
      const response = await authService.loginAdmin({
        phoneNumber: user.username,
        password: user.password
      });
      if (response.code === 200) {
        this.token = response.data.token;
        return;
      } else {
        throw new Error("System user cant logged in");
      }
    } catch (err) {
      errorLog(err);
      throw new Error("System user cant logged in");
    }
  }
}
