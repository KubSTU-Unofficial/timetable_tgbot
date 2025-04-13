import { CallbackQuery } from 'node-telegram-bot-api';
import { kursKeyboard } from '../lib/Keyboards.js';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';

export default class KursQuery extends Query {
    name = ['settings_inst'];
    sceneName = 'settings';

    async exec(user: User, query: CallbackQuery): Promise<void> {
        if (!query?.message?.text) return;

        let text = query.message!.text;
        let db = user.dataBuffer.find((db) => db.id == query.message?.message_id);

        if (!db) {
            Cache.bot.sendMessage(query.message!.chat.id, 'Похоже эта кнопка себя исчерпала');
            return;
        }

        db.inst_id = +query.data!.slice(14, query.data!.length);

        Cache.bot.editMessageText(
            text
                .split('\n\n')
                .slice(0, text.split('\n\n').length - 1)
                .join('\n\n') + '\n\nВыбери свой курс.',
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: kursKeyboard,
                },
            },
        );
    }
}
