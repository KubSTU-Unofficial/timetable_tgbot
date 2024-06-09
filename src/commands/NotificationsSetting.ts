import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import Users from "../models/UsersModel.js";

export default class TodayCommand extends Command {
    name = { buttons: [
        { title: "Включить напоминания", emoji: "🔔" },
        { title: "Выключить напоминания", emoji: "🔕"}
    ]};

    sceneName = ["settings"];

    async exec(user: User, msg: Message): Promise<void> {
        let userData = await Users.findOne({userId: user.id}).exec();
        let condition = Command.commandName({ buttons: { title: "Включить напоминания", emoji: "🔔" } }).includes(msg.text!);

        userData!.notifications = condition;
        user.notifications = condition;

        userData!.save().catch(console.log);

        user.scene = Cache.scenes.find(s => s.name == "main");

        Cache.bot.sendMessage(msg.chat.id,
            condition ? `Напоминания включены.\n\nТеперь бот каждый день (кроме субботы) через час после пар будете автоматически писать тебе расписание на завтра.` : `Напоминания выключены.`,
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