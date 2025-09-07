import { CallbackQuery } from 'node-telegram-bot-api';
import { fakKeyboard } from '../lib/Keyboards.js';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';

export default class FakQuery extends Query {
    name = ['settings_fo'];
    sceneName = 'settings';

    async exec(user: User, query: CallbackQuery): Promise<void> {
        if (!query?.message?.text) return;

        let text = query.message!.text;

        user.dataBuffer.push({
            id: query.message?.message_id,
            fo: query.data!.slice(12, query.data!.length),
        });

        setTimeout(
            () => {
                let elm = user.dataBuffer.find((db) => db.id == query.message?.message_id);

                if (elm) user.dataBuffer = user.dataBuffer.slice(user.dataBuffer.indexOf(elm), 1);
            },
            1000 * 60 * 10,
        );

        Cache.bot.editMessageText(
            text
                .split('\n\n')
                .slice(0, text.split('\n\n').length - 1)
                .join('\n\n') +
                '\n\nКакой у тебя факультет? Напиши <a href="https://t.me/Elektroplayer">сюда</a> если твоего тут нет или возникли проблемы.',
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: fakKeyboard,
                },
                disable_web_page_preview: true,
                parse_mode: 'HTML',
            },
        );

        if (query.data!.slice(12, query.data!.length) == 'zfo')
            Cache.bot.sendMessage(
                query.message.chat.id,
                'ЗФО было добавлено недавно. Если нашли проблемы или считаете элемент интерфейса неудобным, обратитесь <a href="https://t.me/Elektroplayer">сюда</a>',
                {
                    disable_web_page_preview: true,
                    parse_mode: 'HTML',
                },
            );
    }
}
