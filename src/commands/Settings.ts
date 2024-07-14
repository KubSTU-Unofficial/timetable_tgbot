import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import GroupTestMiddleware from "../middlewares/GroupTestMiddleware.js";
// import Users from "../shared/models/UsersModel.js";

export default class SettingsCommand extends Command {
    name = {
        buttons: { title: "Настройки", emoji: "⚙️" },
        command: "settings"
    };

    sceneName = ["main"];
    middlewares = [GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<unknown> {
        if(!user.group) return;
        if (msg.chat.type !== "private") return Cache.bot.sendMessage(msg.chat.id, "Настройки доступны только в личных сообщениях.");

        user.setScene("settings");

        Cache.bot.sendMessage(msg.chat.id, "Выбери, что стоит настроить", {
            reply_markup: {
                keyboard: user.getSettingsKeyboard(),
                remove_keyboard: true,
                resize_keyboard: true,
                //one_time_keyboard: true
            }
        });
    }
}