import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class TodayCommand extends Command {
    name = { buttons: [ { title: "Выключить эмодзи", emoji: "🙅‍♂️" }, "Включить эмодзи" ]};
    sceneName = ["settings"];

    async exec(user: User, msg: Message): Promise<void> {
        // Тут не будет эмодзи в любом случае
        let emoji = msg.text == "Включить эмодзи";

        await user.updateData({ emoji });
        user.setScene("main");

        Cache.bot.sendMessage(msg.chat.id,
            emoji ? `Эмодзи включены.\n\nКрасота!` : `Эмодзи выключены.\n\nЛюбишь минимализм?)`,
            {
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                }
            }
        );
    }
}