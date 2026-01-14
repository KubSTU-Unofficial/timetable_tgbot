import { CallbackQuery, InlineKeyboardButton } from 'node-telegram-bot-api';
import { faculties } from '../shared/lib/Utils.js';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import APIConvertor from '../shared/lib/APIConvertor.js';


export default class FakQuery extends Query {
    name = ['settings'];

    async exec(user: User, query: CallbackQuery): Promise<unknown> {
        if (!query?.message?.text) return;

        let text = query.message!.text;
        let [, fo, fak, year, group] = query.data!.split("__");

        const sendErrorMessage = async (replyText = 'Что-то пошло не так! Повтори попытку позже... \nЕсли проблема не уходит, обратись в поддержку: @Elektroplayer') => {
            return Cache.bot.editMessageText(
                text
                    .split('\n\n')
                    .slice(0, text.split('\n\n').length - 1)
                    .join('\n\n') + '\n\n' +
                replyText,
                {
                    chat_id: query.message!.chat.id,
                    message_id: query.message!.message_id,
                },
            ).catch(this.errorCatcher);
        };

        const groupsInfo: { [key: number]: { substring: number; identifier: string } | undefined } = {
            541: {
                substring: 5,
                identifier: 'ИТ',
            },
        };

        if (!fak) {
            let inline_keyboard: InlineKeyboardButton[][] = [[]];

            let i = 0;
            for (let f in faculties) {
                // @ts-expect-error faculties[f] точно существует
                inline_keyboard[i].push({ text: f, callback_data: `settings__${fo}__${faculties[f]}` });

                if (inline_keyboard[i].length >= 4) inline_keyboard[++i] = [];
            }

            return Cache.bot.editMessageText(
                text
                    .split('\n\n')
                    .slice(0, text.split('\n\n').length - 1)
                    .join('\n\n') +
                '\n\nКакой у тебя институт/факультет?',
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: { inline_keyboard },
                    disable_web_page_preview: true,
                    parse_mode: 'HTML',
                },
            ).catch(this.errorCatcher);
        }

        if (!year) {
            let inline_keyboard: InlineKeyboardButton[][] = [[]];
            for (let i = 1; i <= 6; i++) {
                inline_keyboard[0].push({ text: `${i}`, callback_data: `settings__${fo}__${fak}__${i}` });
            }

            return Cache.bot.editMessageText(
                text
                    .split('\n\n')
                    .slice(0, text.split('\n\n').length - 1)
                    .join('\n\n') + '\n\nКакой у тебя курс?',
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: { inline_keyboard },
                },
            ).catch(this.errorCatcher);
        }

        if (!group) {
            let now: Date = new Date();
            let groupDate = (now.getFullYear() - +year + 1 - (now.getMonth() >= 6 ? 0 : 1)).toString().substring(2);
            let groupsListResp = await APIConvertor.groupsList(now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1), { inst_id: fak, kurs: year, foe: fo as 'ofo' | 'zfo' });

            if (!groupsListResp?.isok) {
                console.log(groupsListResp);
                return sendErrorMessage();
            }

            if (!groupsListResp.data.length) return sendErrorMessage("Список групп пуст. Попробуй ещё раз или обратись за помощью @Elektroplayer");

            let groupNames = groupsListResp.data.map(g => g.name);
            let groupInfo = groupsInfo[+fak];

            if (!groupNames || groupNames.length == 0) return sendErrorMessage("Список групп пуст. Попробуй ещё раз или обратись за помощью @Elektroplayer");

            let inline_keyboard: InlineKeyboardButton[][] = [[]];
            let i = 0;
            for (let grName of groupNames) {
                inline_keyboard[i].push({
                    text: grName.substring(groupInfo?.substring ?? 3),
                    callback_data: `settings__${fo}__${fak}__${year}__${grName}`
                });

                if (inline_keyboard[i].length >= 4) inline_keyboard[++i] = [];
            }

            return Cache.bot.editMessageText(
                text
                    .split('\n\n')
                    .slice(0, text.split('\n\n').length - 1)
                    .join('\n\n') +
                `\n\nКакая у тебя группа: ${groupDate}-${groupInfo?.identifier ?? ''}...\n<i>Если группы видно не полностью, попробуй перевернуть телефон</i>`,
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: { inline_keyboard },
                    parse_mode: 'HTML',
                },
            ).catch(this.errorCatcher);
        }

        user.updateData({ inst_id: +fak, group });
        user.setScene('main');

        Cache.bot.editMessageText(
            'Вся нужная информация была введена, теперь ты можешь смотреть расписание. Если понадобиться перенастроить бота, введи команду /settings.',
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
            },
        ).catch(this.errorCatcher);

        Cache.bot.sendMessage(user.id, 'Выберете, что вам нужно на клавиатуре', {
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
            },
        });
    }
}
