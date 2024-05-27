import { CallbackQuery } from "node-telegram-bot-api";
import Query from "../structures/Query.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

export default class FinalQuery extends Query {
    name = ["settings_group"];
    sceneName = "settings";

    async exec(user: User, query: CallbackQuery): Promise<void> {
        if(!query?.message?.text) return; // не знаю как, но на всякий случай

        let db = user.dataBuffer.find(db => db.id == query.message?.message_id);

        if(!db) {
            Cache.bot.sendMessage(query.message!.chat.id, "Похоже эта кнопка себя исчерпала");
            return;
        }
        
        let group = query.data!.slice(15,query.data!.length);
        user.updateData({
            instId: db.inst_id!,
            group
        });

        user.scene = Cache.scenes.find(s => s.name == "main");
        user.dataBuffer = user.dataBuffer.slice(user.dataBuffer.indexOf(db), 1);
        
        Cache.bot.editMessageText(
            "Вся нужная информация была введена, теперь ты можешь смотреть расписание. Если понадобиться перенастроить бота, введи команду /settings.",
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
            }
        );

        Cache.bot.sendMessage(user.id, "Выберете, что вам нужно на клавиатуре", {
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
            }
        });
    }
}