import { Message } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import SponsorMessagesMiddleware from "../middlewares/SponsorMessages.js";
import GroupTestMiddleware from "../middlewares/GroupTestMiddleware.js";

export default class TomorrowCommand extends Command {
    name = {
        buttons: { title: "Завтрашнее", emoji: "▶️" },
        command: "tomorrow"
    };

    sceneName = ["main"];
    middlewares = [SponsorMessagesMiddleware, GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if(!user.group) return;

        let date = new Date();
        date.setDate(date.getDate() + 1);

        let text;
        let schedule = await user.group.getTextSchedule(date);
        let events = await user.group.getTextEvents(date);

        if(!schedule) text = "<b>Расписание не найдено...</b> <i>или что-то пошло не так...</i>";
        else text = schedule;

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