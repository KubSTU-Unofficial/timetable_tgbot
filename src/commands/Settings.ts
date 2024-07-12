import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import Users from "../shared/models/UsersModel.js";

export default class TodayCommand extends Command {
    name = {
        buttons: { title: "Настройки", emoji: "⚙️" },
        command: "settings"
    };

    sceneName = ["main"];

    async exec(user: User, msg: Message): Promise<void> {
        if (msg.chat.type !== "private") {
            Cache.bot.sendMessage(msg.chat.id, "Настройки доступны только в личных сообщениях.");

            return;
        }

        let userData = await Users.findOne({userId: user.id}).exec();

        if (!userData) {
            Cache.bot.sendMessage(msg.chat.id, "Сначала введи свои данные! /start");

            return;
        }

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