import { CallbackQuery } from 'node-telegram-bot-api';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import Classroom from '../shared/structures/Auditory.js';


export default class FinalQuery extends Query {
    name = ['audFinder'];
    sceneName = 'main';

    async exec(_user: User, query: CallbackQuery): Promise<void> {
        if (!query.message) return;

        let [, building, arg2] = query.data?.split('__') ?? [];
        let number = !arg2 ? 1 : +arg2;
        let text = (await Classroom.getFreeClassrooms(building, number)).join('; ');

        const makeBtn = (text: string, suffix: number) => ({
            text,
            callback_data: `audFinder__${building}__${suffix}`,
        });

        const keyboard: { text: string, callback_data: string }[][] = [[]];
        if (number > 1) keyboard[0].push(makeBtn('Предыдущая', number - 1));
        if (number < 8) keyboard[0].push(makeBtn('Следующая', number + 1));

        Cache.bot.editMessageText(
            `<b>Поиск свободных аудиторий</b> (на сегодняшний день)\n\n${number} пара:\n\n` + text,
            {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: keyboard,
                },
            },
        ).catch(this.errorCatcher);
    }
}
