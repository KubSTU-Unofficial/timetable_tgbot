import { CallbackQuery } from "node-telegram-bot-api";
import User from "./User.js";

export default abstract class Query {
    abstract name: string[];
    abstract sceneName: string;

    abstract exec(user: User, query: CallbackQuery): void;
}