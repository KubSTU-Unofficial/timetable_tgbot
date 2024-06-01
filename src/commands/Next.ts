import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import SponsorMessagesMiddleware from "../middlewares/SponsorMessages.js";
import { days } from "../lib/Utils.js";

export default class NearestCommand extends Command {
    name = {
        buttons: { title: "Ближайшее", emoji: "⏩"},
        command: "nearest"
    };
    
    sceneName = ["main"];
    middlewares = [SponsorMessagesMiddleware];

    async errorMessage(msg: Message) {
        Cache.bot.sendMessage(msg.chat.id, "<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>", {
            parse_mode: "HTML",
            reply_markup: {
                remove_keyboard: msg.chat.type !== "private"
            },
            disable_web_page_preview: true
        });

        return;
    }

    async exec(user: User, msg: Message): Promise<void> {
        if(!user.group) return;

        let date = new Date();
        let fullRawSchedule = await user.group.getFullRawSchedule();

        if(!fullRawSchedule || !fullRawSchedule.length) return this.errorMessage(msg);

        let day:number = 0, week:boolean = true, schedule:IOFORespPara[] = [], eventsText: string | null = null;

        for(let i = 0;i <= 14;i++) {
            day         = date.getDay();
            week        = date.getWeek()%2 == 0;
            schedule    = fullRawSchedule.filter(p => p.nedtype.nedtype_id == (week ? 2 : 1) && p.dayofweek.dayofweek_id == day);
            eventsText  = await user.group.getTextEvents();

            if(schedule.length || eventsText) break;
            else date.setDate(date.getDate() + 1);
        }

        if(!schedule.length && !eventsText) return this.errorMessage(msg);

        let textSchedule = user.group.formatSchedule(schedule, date);
        let text = `<b>${days[day]} / ${week ? "Чётная" : "Нечётная"} неделя</b>` +
        (!textSchedule ? "\nПар нет! Передохни:з" : textSchedule) +
        (eventsText ? `\n\n${eventsText}` : "");
        
        Cache.bot.sendMessage(msg.chat.id, text, {
            parse_mode: "HTML",
            reply_markup: {
                remove_keyboard: msg.chat.type !== "private"
            },
            disable_web_page_preview: true
        });
    }
}