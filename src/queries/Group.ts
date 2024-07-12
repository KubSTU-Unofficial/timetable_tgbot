import { CallbackQuery } from "node-telegram-bot-api";
import Query from "../structures/Query.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import ScheduleModel from "../shared/models/ScheduleModel.js";

interface KeyboardButton {
    text: string,
    callback_data: string
}

export default class GroupQuery extends Query {
    name = ["settings_kurs"];
    sceneName = "settings";

    async exec(user: User, query: CallbackQuery): Promise<void> {
        if(!query?.message?.text) return; // не знаю как, но на всякий случай

        let db = user.dataBuffer.find(db => db.id == query.message?.message_id);

        if(!db) {
            Cache.bot.sendMessage(query.message!.chat.id, "Похоже эта кнопка себя исчерпала");
            return;
        }
    
        db.kurs = +query.data!.slice(14,query.data!.length);
    
        let text: string  = query.message!.text;
        let now: Date     = new Date();
        let groupDate     = (now.getFullYear() - db.kurs + 1 - ( now.getMonth() >= 6 ? 0 : 1)).toString().substring(2);
        let schedules     = await ScheduleModel.find({inst_id: db.inst_id!, group: { $regex: `^${groupDate}-`}}).exec();
        let groups        = schedules.map(s => s.group);
        
        if(!groups || groups!.length == 0) {
            Cache.bot.editMessageText(text.split("\n\n").slice(0,text.split("\n\n").length-1).join("\n\n") + "\n\nЧто-то пошло не так! Повтори попытку позже... \nЕсли проблема не уходит, обратись в поддержку: @Elektroplayer", {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
            });

            return;
        }

        let keyboard: KeyboardButton[][]  = [];
        let buffer: KeyboardButton[]      = [];

        for(let i = 0;i<groups.length;i++) {
            if(i%4==0 && i!=0) {
                keyboard.push(buffer);
                buffer = [];
            }
            buffer.push({
                text: groups[i].substring(3),
                callback_data: "settings_group_"+groups[i]
            });
        }

        keyboard.push(buffer);

        Cache.bot.editMessageText(text.split("\n\n").slice(0,text.split("\n\n").length-1).join("\n\n") + `\n\nВыбери свою группу. ${groupDate}-...`, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
}