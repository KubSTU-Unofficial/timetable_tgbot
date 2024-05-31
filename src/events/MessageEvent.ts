import TelegramBot from "node-telegram-bot-api";
import Event from "../structures/Event.js";
import Cache from "../lib/Cache.js";
import Middleware from "../structures/Middleware.js";
import Command from "../structures/Command.js";

export default class MessageEvent extends Event {
    name = "message" as BotEvents;

    async exec(msg: TelegramBot.Message): Promise<void> {
        if (!msg.from || !msg.text || msg.chat.type == "channel") return;

        let user = await Cache.getUser(msg.from.id);

        user.updateLastActivity();

        if (!user.scene) user.setScene("main");

        let command = user.scene!.commands.find((c) => Command.commandName(c.name).includes(msg.text!) ) ?? user.scene!.commands.find(c => Command.commandName(c.name).length == 0);

        if (!command) {
            if (msg.chat.type == "private") {
                await Cache.bot.sendMessage(msg.chat.id, "Неизвестная команда", {
                    reply_markup: {
                        keyboard: user.getMainKeyboard(),
                        resize_keyboard: true,
                    }
                });

                user.scene = Cache.scenes.find(x => x.name == "main");
            }
        } else {

            // Отправка сообщения в консоль происходит уже после проверки на существование команды (19 строка)
            // Если сообщение не является командой, я не увижу ваше сообщение
            // В добавок в группе можно отключить доступ к сообщениям у бота, команды будут работать

            console.log(`[message] ${msg.from?.username ?? msg.from?.first_name ?? "Нет ника (?)"}, ${msg.from.id}: ${user.group?.name ?? "Не выбрана"}; ${msg.text};` );

            // await command.middlewares.filter(mw => mw.type == Middleware.types.Pre).forEach(async mw => {
            //     await mw.exec(user, msg);
            // });

            // Проверяем, все ли middlewares "согласны"
            let condition = command.middlewares
                .filter(mw => mw.type == Middleware.types.Pre)
                .some(mw => ![0, undefined].includes(mw.exec(user, msg)!));

            if(condition) return;

            await command.exec(user, msg);

            // Выполняем, как я их называл postwares
            command.middlewares.filter(mw => mw.type == Middleware.types.Post).forEach(mw => mw.exec(user, msg));
        }
    }
}