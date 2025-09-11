import { CallbackQuery } from 'node-telegram-bot-api';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import { groupsList } from '../shared/lib/APIConvertor.js';

interface KeyboardButton {
    text: string;
    callback_data: string;
}

let groupsInfo: { [key: number]: { substring: number; identifier: string } | undefined } = {
    541: {
        substring: 5,
        identifier: 'ИТ',
    },
};

export default class GroupQuery extends Query {
    name = ['settings_kurs'];
    sceneName = 'settings';

    async exec(user: User, query: CallbackQuery): Promise<unknown> {
        if (!query?.message?.text) return; // не знаю как, но на всякий случай

        let db = user.dataBuffer.find((db) => db.id == query.message?.message_id);

        if (!db) {
            Cache.bot.sendMessage(query.message!.chat.id, 'Похоже эта кнопка себя исчерпала');
            return;
        }

        db.kurs = +query.data!.slice(14, query.data!.length);

        let sendErrorMessage = () => {
            return Cache.bot.editMessageText(
                text
                .split('\n\n')
                .slice(0, text.split('\n\n').length - 1)
                .join('\n\n') +
                '\n\nЧто-то пошло не так! Повтори попытку позже... \nЕсли проблема не уходит, обратись в поддержку: @Elektroplayer',
                {
                    chat_id: query.message!.chat.id,
                    message_id: query.message!.message_id,
                },
            );
        };

        let text: string = query.message!.text;
        let now: Date = new Date();
        let groupDate = (now.getFullYear() - db.kurs + 1 - (now.getMonth() >= 6 ? 0 : 1)).toString().substring(2);
        let groupsListResp = await groupsList(now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1), { inst_id: db.inst_id, kurs: db.kurs, foe: db.fo as 'ofo' | 'zfo'});

        if(!groupsListResp?.isok || groupsListResp.data.length < 1) {
            console.log(groupsListResp);
            return sendErrorMessage();
        }

        let groupNames = groupsListResp?.data.map(g => g.name);
        let groupInfo = groupsInfo[db.inst_id!];

        if (!groupNames || groupNames.length == 0) return sendErrorMessage();

        let keyboard: KeyboardButton[][] = [];
        let buffer: KeyboardButton[] = [];

        for (let i = 0; i < groupNames.length; i++) {
            if (i % 4 == 0 && i != 0) {
                keyboard.push(buffer);
                buffer = [];
            }
            buffer.push({
                text: groupNames[i].substring(groupInfo?.substring ?? 3),
                callback_data: 'settings_group_' + groupNames[i],
            });
        }

        keyboard.push(buffer);

        Cache.bot.editMessageText(
            text
                .split('\n\n')
                .slice(0, text.split('\n\n').length - 1)
                .join('\n\n') +
                `\n\nКакая у тебя группа: ${groupDate}-${groupInfo?.identifier ?? ''}...\n<i>Если группы видно не полностью, попробуй перевернуть телефон</i>`,
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: { inline_keyboard: keyboard },
                parse_mode: 'HTML',
            },
        );
    }
}
