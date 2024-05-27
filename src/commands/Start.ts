import { Message } from "node-telegram-bot-api";
import { instKeyboard } from "../lib/Keyboards.js";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class TodayCommand extends Command {
    name = { command: "start" };
    sceneName = [];

    async exec(user: User, msg: Message): Promise<void> {
        let replytext = `<b>Приветствую, ${msg.from!.username}</b>\n\n`;

        if(msg.chat.type !== "private") {
            if(!user.group) replytext += "Конкретно у тебя не установлена некоторая важная для меня информация. Давай поговорим в личных сообщениях.";
            else replytext += "Можешь воспользоваться командами снизу:\n\n/today - Расписание на сегодня\n/tomorrow - Расписание на завтра\n/nearest - Ближайшее расписание\n/about - Информация о боте";
            
            Cache.bot.sendMessage(msg.chat.id, replytext, {
                parse_mode: "HTML",
                disable_web_page_preview: true
            });
        } else {
            if(!user.group) {
                user.scene = Cache.scenes.find(s => s.name == "settings");

                replytext += "У тебя не установлена некоторая важная для меня информация. Подскажи пожалуйста,\n\nКакой у тебя институт. Если твоего тут нет, значит можешь написать мне в ЛС (@Elektroplayer), чтобы я его добавил. Если что-то пошло не так, пиши туда же - я не кусаюсь.";

                Cache.bot.sendMessage(msg.chat.id, replytext, {
                    disable_web_page_preview: true,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: instKeyboard,
                        resize_keyboard: true,
                    }
                });

            } else {
                replytext += `Поддержка: @Elektroplayer\n` +
                `Новости: @kubstu_schedule_news\n` +
                `GitHub: <a href="https://github.com/Elektroplayer/kubstu_timetable_tgbot">Elektroplayer/kubstu_timetable_tgbot</a>\n` +
                `Обладаемая информация: <a href="https://github.com/Elektroplayer/kubstu_timetable_tgbot#%D1%87%D1%82%D0%BE-%D1%8F-%D0%BE-%D0%B2%D0%B0%D1%81-%D0%B7%D0%BD%D0%B0%D1%8E">тут</a>\n` +
                `Поддержать меня:\n` +
                `Т: 5536 9141 8751 4363\n` +
                `С: 2202 2050 2291 3625`,

                user.scene = Cache.scenes.find(s => s.name == "main");

                Cache.bot.sendMessage(msg.chat.id, replytext, {
                    disable_web_page_preview: true,
                    parse_mode: "HTML",
                    reply_markup: {
                        keyboard: user.getMainKeyboard(),
                        resize_keyboard: true,
                    }
                });
            }
        }
    }
}