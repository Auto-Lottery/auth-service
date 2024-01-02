import { errorLog } from "../utilities/log";
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
}
