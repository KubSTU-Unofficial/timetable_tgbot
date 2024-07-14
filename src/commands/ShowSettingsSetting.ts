import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class TodayCommand extends Command {
    name = { buttons: [
        { title: "Убрать настройки", emoji: "⚙️" },
        { title: "Показывать настройки", emoji: "⚙️"}
    ]};

    sceneName = ["settings"];

    async exec(user: User, msg: Message): Promise<void> {
        let showSettings = Command.commandName({ buttons: { title: "Показывать настройки", emoji: "⚙️" } }).includes(msg.text!);

        user.updateData({ showSettings });
        user.setScene("main");

        Cache.bot.sendMessage(msg.chat.id,
            showSettings ? 
            `В меню теперь показываются настройки.` :
            `Настройки убраны из меню.\n\nЕсли тебе понадобятся настройки снова, напиши /settings.`,
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