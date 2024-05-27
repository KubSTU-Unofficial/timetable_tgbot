import { Message } from "node-telegram-bot-api";
import User from "./User.js";

enum MiddlewareTypes {
    Pre,
    Post,
    Test
}

export default abstract class Middleware {
    static types = MiddlewareTypes;

    type = MiddlewareTypes.Pre;

    abstract exec(user: User, msg: Message):void | number;
}