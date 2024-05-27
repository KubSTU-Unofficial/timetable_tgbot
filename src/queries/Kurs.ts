import { CallbackQuery } from "node-telegram-bot-api";
import { kursKeyboard } from "../lib/Keyboards.js";
import Query from "../structures/Query.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class KursQuery extends Query {
    name = ["settings_inst"];
    sceneName = "settings";

    async exec(user: User, query: CallbackQuery): Promise<void> {
        if(!query?.message?.text) return;

        let text = query.message!.text;

        user.dataBuffer.push({
            id: query.message?.message_id,
            inst_id: +query.data!.slice(14,query.data!.length)
        });

        setTimeout(() => {
            let elm = user.dataBuffer.find(db => db.id == query.message?.message_id);

            if(elm) user.dataBuffer = user.dataBuffer.slice(user.dataBuffer.indexOf(elm), 1);
        }, 1000*60*5);
    
        Cache.bot.editMessageText(
            text.split("\n\n").slice(0,text.split("\n\n").length-1).join("\n\n") + "\n\nВыбери свой курс.",
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: kursKeyboard,
                }
            }
        );
    }
}