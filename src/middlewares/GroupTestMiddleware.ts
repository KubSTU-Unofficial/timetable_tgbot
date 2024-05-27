import { Message } from "node-telegram-bot-api";
import Middleware from "../structures/Middleware.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

class GroupTestMiddleware extends Middleware {
    type = Middleware.types.Pre;

    exec(user: User, msg: Message): number | void {
        if (!user.group) {
            Cache.bot.sendMessage(user.id, "У меня нет данных о тебе. Напиши /start" + (msg.chat.type !== "private" ? "мне в ЛС" : ""));

            return 1;
        }
    }
}

export default new GroupTestMiddleware();