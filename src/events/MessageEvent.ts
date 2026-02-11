import TelegramBot from 'node-telegram-bot-api';
import Event from '../structures/Event.js';
import Cache from '../lib/Cache.js';
import Middleware from '../structures/Middleware.js';

export default class MessageEvent extends Event {
    name = 'message' as BotEvents;

    async exec(msg: TelegramBot.Message): Promise<void> {
        if (!msg.from || !msg.text || msg.chat.type == 'channel') return;

        let user = await Cache.getUser(msg.from.id);

        user.updateLastActivity();

        if (!user.scene) user.setScene('main');

        // Делегируем поиск команды текущей сцене пользователя
        const command = user.scene!.findCommand(msg.text);

        if (!command) {
            if (msg.chat.type == 'private') {
                await Cache.bot.sendMessage(msg.chat.id, 'Неизвестная команда', {
                    reply_markup: {
                        keyboard: user.getMainKeyboard(),
                        resize_keyboard: true,
                    },
                });
                // Возвращаем пользователя в главное меню, если команда не найдена
                user.setScene('main');
            }
            return;
        }

        // Отправка сообщения в консоль происходит уже после проверки на существование команды
        // Если сообщение не является командой, я не увижу ваше сообщение
        // В добавок в группе можно отключить доступ к сообщениям у бота, команды будут работать

        console.dlog(
            `[message] ${msg.from?.username ?? msg.from?.first_name ?? 'Нет ника (?)'}, ${msg.from.id}: ${user.group?.name ?? 'Не выбрана'}; ${msg.text};`,
        );

        try {
            // Pre-middlewares
            for (const mw of command.middlewares.filter(m => m.type === Middleware.types.Pre)) {
                const result = await mw.exec(user, msg);
                if (result === 1) { // Явный стоп-сигнал
                    return;
                }
            }

            try {
                // Command execution
                await command.exec(user, msg);
            } catch (err) {
                console.log(err);
            }

            // Post-middlewares
            for (const mw of command.middlewares.filter(m => m.type === Middleware.types.Post)) {
                await mw.exec(user, msg);
            }
        } catch (error) {
            console.error(`Error executing command "${msg.text}" for user ${user.id}:`, error);
            await Cache.bot.sendMessage(msg.chat.id, 'Произошла внутренняя ошибка. Мы уже работаем над этим.');
        }
    }
}
