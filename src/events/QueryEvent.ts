import TelegramBot from 'node-telegram-bot-api';
import Event from '../structures/Event.js';
import Cache from '../lib/Cache.js';

export default class QueryEvent extends Event {
    name = 'callback_query' as BotEvents;

    async exec(query: TelegramBot.CallbackQuery): Promise<void> {
        if (!query.data || !query.message) {
            // Если нет данных или сообщения, мы не можем ничего сделать
            if (query.message) Cache.bot.answerCallbackQuery(query.id, { text: 'Ошибка: нет данных для обработки.' });

            return;
        }

        const chatId = query.message.chat.id;

        try {
            const user = await Cache.getUser(query.from.id);
            if (!user.scene) user.setScene('main');

            const execQuery = Cache.queries.find((q) => q.name.some((n) => query.data!.startsWith(n)));

            if (!execQuery) {
                await Cache.bot.editMessageText('Похоже, эта кнопка себя исчерпала.', {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                });
            } else {
                await execQuery.exec(user, query);
            }
        } catch (err) {
            console.error('Error processing callback query:', err, query);
            try {
                await Cache.bot.sendMessage(chatId, '😕 Что-то пошло не так при обработке вашего запроса. Попробуйте еще раз.');
            } catch (sendError) {
                console.error('Failed to send error message to user:', sendError);
            }
        }
    }
}
