import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import Users from "../shared/models/UsersModel.js";

export default class TodayCommand extends Command {
    name = { buttons: [
        { title: "Убрать расписания преподавателей", emoji: "⚙️" },
        { title: "Показывать расписания преподавателей", emoji: "⚙️"}
    ]};

    sceneName = ["settings"];

    async exec(user: User, msg: Message): Promise<void> {
        let userData = await Users.findOne({userId: user.id}).exec();
        let condition = Command.commandName({ buttons: { title: "Показывать расписания преподавателей", emoji: "⚙️" } }).includes(msg.text!);

        userData!.showTeachers = condition;
        user.showTeachers = condition;

        userData!.save().catch(console.log);

        user.scene = Cache.scenes.find(s => s.name == "main");

        Cache.bot.sendMessage(msg.chat.id,
            condition ?
            `В меню теперь показываются расписания преподавателей` :
            `Расписания преподавателей убраны из меню, но они доступны по слову "преподаватели".\n\nВернуть кнопку обратно можно в /settings.`,
            {
                parse_mode: "HTML",
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                    //one_time_keyboard: true
                }
            }
        );
    }
}