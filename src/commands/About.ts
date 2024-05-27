import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class TodayCommand extends Command {
    name = { command: "about" };
    sceneName = [];

    async exec(user: User, msg: Message): Promise<void> {
        Cache.bot.sendMessage(
            msg.chat.id,
            `<b>Приветствую, ${msg.from!.username}\n\n</b>` +

            `Поддержка: @Elektroplayer\n` +
            `Новости: @kubstu_schedule_news\n` +
            `GitHub: <a href="https://github.com/Elektroplayer/kubstu_timetable_tgbot">Elektroplayer/kubstu_timetable_tgbot</a>\n` +
            `Обладаемая информация: <a href="https://github.com/Elektroplayer/kubstu_timetable_tgbot#%D1%87%D1%82%D0%BE-%D1%8F-%D0%BE-%D0%B2%D0%B0%D1%81-%D0%B7%D0%BD%D0%B0%D1%8E">тут</a>\n` +
            `Поддержать меня:\n` +
            `Т: 5536 9141 8751 4363\n` +
            `С: 2202 2050 2291 3625`,
            {
                disable_web_page_preview: true,
                parse_mode: "HTML"
            }
        );
    }
}