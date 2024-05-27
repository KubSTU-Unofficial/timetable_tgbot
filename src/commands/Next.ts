import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import SponsorMessagesMiddleware from "../middlewares/SponsorMessages.js";

export default class NearestCommand extends Command {
    name = {
        buttons: { title: "Ближайшее", emoji: "⏩"},
        command: "nearest"
    };
    
    sceneName = ["main"];
    middlewares = [SponsorMessagesMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if(!user.group) return;

        let date = new Date();

        // TODO: Оптимизировать
        let schedule, events;
        for(let i=0;i<=14;i++) {
            date.setDate(date.getDate() + 1);

            schedule = await user.group.getTextSchedule(date);
            events = await user.group.getTextEvents(date);

            if(schedule.indexOf("Пар нет! Передохни:з") == -1 || events) break;
        }
        
        let text = schedule && schedule.indexOf("Пар нет! Передохни:з") == -1 ? schedule : "<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>";

        if(events) text += `\n\n${events}`;
        // if(events && (!user.group.token || user.token == user.group.token)) text += `\n\n${events}`;
        
        Cache.bot.sendMessage(
            msg.chat.id,
            text,
            {
                parse_mode: "HTML",
                reply_markup: {
                    remove_keyboard: msg.chat.type !== "private"
                }
            }
        );
    }
}