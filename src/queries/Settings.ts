import { CallbackQuery, InlineKeyboardButton } from 'node-telegram-bot-api';
import { faculties, facultiesReverse } from '../shared/lib/Utils.js';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import APIConvertor from '../shared/lib/APIConvertor.js';


export default class FakQuery extends Query {
    name = ['settings']; // settings__{fo}__{fak}__{year}__{group} TODO: проверить, что не будет слишком

    async exec(user: User, query: CallbackQuery): Promise<unknown> {
        if (!query?.message?.text) return;

        let [, fo, fak, year, group] = query.data!.split("__");

        const sendErrorMessage = async (replyText = '<b>Что-то не так...</b> Повтори попытку позже...\nЕсли проблема не уходит, обратись сюда: @Elektroplayer') => {
            return Cache.bot.editMessageText(
                replyText,
                {
                    chat_id: query.message!.chat.id,
                    message_id: query.message!.message_id,
                    disable_web_page_preview: true,
                    parse_mode: 'HTML',
                },
            ).catch(this.errorCatcher);
        };

        const groupsInfo: { [key: number]: { substring: number; identifier: string } | undefined } = {
            541: {
                substring: 5,
                identifier: 'ИТ',
            },
        };

        // TODO: Добавить кнопки "Назад" и, значит, выбор ФО

        if (!fak) {
            let inline_keyboard: InlineKeyboardButton[][] = [[]];

            let i = 0;
            for (let f in faculties) {
                // @ts-expect-error faculties[f] точно существует
                inline_keyboard[i].push({ text: f, callback_data: `settings__${fo}__${faculties[f]}` });

                if (inline_keyboard[i].length >= 4) inline_keyboard[++i] = [];
            }

            return Cache.bot.editMessageText(
                `<b>Ты выбрал ${fo == 'ofo' ? "очную" : "заочную"} форму обучения!</b> Поехали дальше\n\nКакой у тебя институт/факультет?`,
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
                `<b>Ага, ${facultiesReverse[+fak]}, да?</b> Записал, идём дальше!\n\nКакой у тебя курс?`,
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: { inline_keyboard },
                    parse_mode: 'HTML',
                },
            ).catch(this.errorCatcher);
        }

        if (!group) {
            let now: Date = new Date();
            let groupDate = (now.getFullYear() - +year + 1 - (now.getMonth() >= 6 ? 0 : 1)).toString().substring(2);
            let groupsListResp = await APIConvertor.groupsList(now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1), { inst_id: fak, kurs: year, foe: fo as 'ofo' | 'zfo' }); // TODO: А не много ли надежды на безнадёжное API?

            if (!groupsListResp?.isok) {
                console.log(groupsListResp);
                return sendErrorMessage();
            }

            let textGroupsNotFound = "<b>Эм... тут нет групп.</b> Ты уверен, что указал всё правильно?\nНапиши /start и попробуй ещё раз. Если проблема сохраняется, обратись сюда: @Elektroplayer";
            if (!groupsListResp.data.length) return sendErrorMessage(textGroupsNotFound);

            let groupNames = groupsListResp.data.map(g => g.name);
            let groupInfo = groupsInfo[+fak];

            if (!groupNames || groupNames.length == 0) return sendErrorMessage(textGroupsNotFound);

            let inline_keyboard: InlineKeyboardButton[][] = [[]];
            let i = 0;
            for (let grName of groupNames) {
                inline_keyboard[i].push({
                    text: grName.substring(groupInfo?.substring ?? 3),
                    callback_data: `settings__${fo}__${fak}__${year}__${grName}`
                });

                if (inline_keyboard[i].length >= 4) inline_keyboard[++i] = [];
            }

            let names = ["простичтокурсники", "первокурсники", "второкурсники", "третьекурсники", "старшекурсники"] // Мне лень, ахах

            return Cache.bot.editMessageText(
                `<b>Финишная прямая!</b> Это все ${names[+year > 4 ? 4 : +year]} которые я смог найти! <i>Если группы видно не полностью, попробуй перевернуть телефон</i>\n\nИтак, твоя группа: ${groupDate}-${groupInfo?.identifier ?? ''}...`,
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: { inline_keyboard },
                    parse_mode: 'HTML',
                },
            ).catch(this.errorCatcher);
        }

        Cache.bot.editMessageText(
            '<b>Отлично, мы закончили!</b>\nЩа сохраняю и идём дальше...',
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                parse_mode: 'HTML',
            },
        ).catch(this.errorCatcher);

        user.updateData({ inst_id: +fak, group });
        user.setScene('main');

        Cache.bot.sendMessage(
            user.id,
            `<b>Добро пожаловать в главное меню.</b>\n\n` +
            `Тут можно посмотреть расписание на сегодня, завтра или на определённый день. /showall покажет полное расписание, а /exams даст расписание экзаменов. В инструментах есть прикольные <i>штучки</i>, а в настройках можешь немного изменить интерфейс, включить автоматическую отправку расписания или сменить группу.`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                },
            }
        );
    }
}
