import User from "./User.js";
import { Message } from "node-telegram-bot-api";
import Middleware from "./Middleware.js";

export default abstract class Command {
    abstract name: CommandName;
    abstract sceneName: string[];

    middlewares:Middleware[] = [];

    abstract exec(user: User, msg: Message): Promise<void>;
}