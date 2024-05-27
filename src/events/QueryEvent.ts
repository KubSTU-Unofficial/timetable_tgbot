import TelegramBot from "node-telegram-bot-api";
import Event from "../structures/Event.js";
import Cache from "../lib/Cache.js";

export default class QueryEvent extends Event {
    name = "callback_query" as BotEvents;

    async exec(query: TelegramBot.CallbackQuery): Promise<void> {
        if (!query.data) return;

        let user = await Cache.getUser(query.from.id);

        if (!user.scene) user.scene = Cache.scenes.find((s) => s.name == "main");

        let execQuery = user.scene!.queries.find((q) => q.name.some((n) => query.data?.startsWith(n)) );

        if (!execQuery) Cache.bot.sendMessage(
            query.message!.chat.id,
            "Похоже эта кнопка себя исчерпала"
        );
        else execQuery.exec(user, query);
    }
}
