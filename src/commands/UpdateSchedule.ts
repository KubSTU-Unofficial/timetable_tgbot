import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import GroupTestMiddleware from "../middlewares/GroupTestMiddleware.js";

export default class TodayCommand extends Command {
    name = { command: "update" };
    sceneName = ["main"];
    middlewares = [GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if(!user.group) return;
    
        let schedule = await user.group.getFullRawSchedule();

        if(schedule && new Date().valueOf() - schedule.updateDate.valueOf() < 1000 * 60 * 60) {
            Cache.bot.sendMessage(
                msg.chat.id,
                "<b>Не так быстро!</b> Расписание уже было обновлено менее часа назад!",
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        remove_keyboard: msg.chat.type != "private"
                    }
                }
            );

            return;
        }

        let r = await user.group.updateScheduleFromSite(); // response
        
        Cache.bot.sendMessage(
            msg.chat.id,
            r == null ? "Произошла ошибка обновления! Возможно, сайт не работает." : "Расписание обновлено принудительно!",
            {
                reply_markup: {
                    remove_keyboard: msg.chat.type != "private"
                }
            }
        );
    }
}