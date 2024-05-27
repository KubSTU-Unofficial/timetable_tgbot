import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import Users from "../models/UsersModel.js";

export default class TodayCommand extends Command {
    name = { buttons: [ { title: "Выключить эмодзи", emoji: "🙅‍♂️" }, "Включить эмодзи" ]};
    sceneName = ["settings"];

    async exec(user: User, msg: Message): Promise<void> {
        let userData = await Users.findOne({userId: user.id}).exec();
        let condition = msg.text == "Включить эмодзи";

        userData!.emoji = condition;
        user.emoji = condition;

        userData!.save().catch(console.log);

        user.scene = Cache.scenes.find(s => s.name == "main");

        Cache.bot.sendMessage(msg.chat.id,
            condition ? `Эмодзи включены.\n\nКрасота!` : `Эмодзи выключены.\n\nЛюбишь минимализм?)`,
            {
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                }
            }
        );
    }
}