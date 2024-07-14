import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class NotificationSettingsCommand extends Command {
    name = { buttons: [
        { title: "Включить напоминания", emoji: "🔔" },
        { title: "Выключить напоминания", emoji: "🔕"}
    ]};

    sceneName = ["settings"];

    async exec(user: User, msg: Message): Promise<void> {
        let notifications = Command.commandName({ buttons: { title: "Включить напоминания", emoji: "🔔" } }).includes(msg.text!);

        user.updateData({ notifications });
        user.setScene("main");

        Cache.bot.sendMessage(msg.chat.id,
            notifications ? `Напоминания включены.\n\nТеперь бот каждый день (кроме субботы) через час после пар будете автоматически писать тебе расписание на завтра.` : `Напоминания выключены.`,
            {
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                    //one_time_keyboard: true
                }
            }
        );
    }
}