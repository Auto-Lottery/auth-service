import AdminUserModel from "../models/admin-user.model";
import { errorLog } from "../utilities/log";
import { Filter, generateQuery } from "../utilities/mongo";
import { AuthService } from "./auth.service";
import RabbitMQManager from "./rabbitmq-manager";

export class AdminService {
  private authService;
  constructor() {
    this.authService = new AuthService();
  }
  async registerRequestSentToQueue(phoneNumber: string) {
    try {
      const rabbitMQManager = RabbitMQManager.getInstance();
      const rabbitMqChannel = await rabbitMQManager.createChannel("users");
      if (rabbitMqChannel) {
        rabbitMqChannel.sendToQueue(
          "register",
          Buffer.from(
            JSON.stringify({
              phoneNumber
            })
          ),
          {
            persistent: true
          }
        );
      }
    } catch (err) {
      errorLog(err);
    }
  }

  async registerUserFromQueue() {
    const exchangeName = "users";
    const queueName = "register";
    const routingKey = "bulk";
    const rabbitMqManager = RabbitMQManager.getInstance();
    const queueChannel = await rabbitMqManager.createChannel(exchangeName);

    queueChannel.assertExchange(exchangeName, "direct", {
      durable: true
    });

    queueChannel.assertQueue(queueName, {
      durable: true
    });

    queueChannel.bindQueue(queueName, exchangeName, routingKey);

    queueChannel.prefetch(1);

    queueChannel.consume(
      queueName,
      async (msg) => {
        if (msg?.content) {
          const dataJsonString = msg.content.toString();
          if (!dataJsonString) {
            errorLog("Queue empty message");
            queueChannel.ack(msg);
            return;
          }
          try {
            const userData = JSON.parse(dataJsonString);
            await this.authService.register(userData.phoneNumber);
            queueChannel.ack(msg);
          } catch (err) {
            errorLog("Transaction update queue error::: ", err);
            queueChannel.ack(msg);
          }
        }
      },
      {
        noAck: false
      }
    );
  }

  async getAdminUserList(filter: Filter) {
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

      const users = await AdminUserModel.find(
        query,
        "phoneNumber status roles operator"
      )
        .skip(skip)
        .limit(pageSize)
        .sort({
          [field]: order === "desc" ? -1 : 1
        });
      const count = await AdminUserModel.countDocuments(query);
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
