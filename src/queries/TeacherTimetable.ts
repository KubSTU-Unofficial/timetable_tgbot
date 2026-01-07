import { CallbackQuery } from 'node-telegram-bot-api';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import { parse, format } from 'date-fns';
import Teacher from '../structures/Teacher.js';
import Cache from '../lib/Cache.js';

export default class FinalQuery extends Query {
    name = ['TTT']; // TTT__{whatdo}__{date?}

    async errorTeacherError(query: CallbackQuery) {
        return Cache.bot.editMessageText('Произошла ошибка, преподаватель не найден.\nЕсли это повторяется, обратитесь в <a href="https://t.me/Elektroplayer">поддержку</a>', { // TODO: ссылку
            parse_mode: 'HTML',
            chat_id: query.message!.chat.id,
            message_id: query.message!.message_id,
        }).catch((err) => {
            if (err.toString() !== "TelegramError: ETELEGRAM: 400 Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message")
                console.log(err)
        });
    }

    async errorTimetableUndefined(query: CallbackQuery) {
        return Cache.bot.editMessageText('При получении расписания произошла ошибка.\nЕсли это повторяется, обратитесь в <a href="https://t.me/Elektroplayer">поддержку</a>', {
            parse_mode: 'HTML',
            chat_id: query.message!.chat.id,
            message_id: query.message!.message_id,
        }).catch((err) => {
            if (err.toString() !== "TelegramError: ETELEGRAM: 400 Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message")
                console.log(err)
        });
    }

    async exec(user: User, query: CallbackQuery): Promise<unknown> {
        if (!query.message) return;

        let [, whatdo, arg2] = query.data?.split('__') ?? [];

        if (whatdo == 'set') {
            let dateToday = parse(arg2, 'dd.MM.yyyy', new Date());
            let dateTommorow = new Date(dateToday.valueOf() + 1000 * 60 * 60 * 24);
            let dateYesterday = new Date(dateToday.valueOf() - 1000 * 60 * 60 * 24);

            // Скип воскресенья
            if (dateTommorow.getDay() == 0) dateTommorow = new Date(dateTommorow.valueOf() + 1000 * 60 * 60 * 24);
            if (dateYesterday.getDay() == 0) dateYesterday = new Date(dateYesterday.valueOf() - 1000 * 60 * 60 * 24);

            // TODO: Получение имени преподавателя происходит самым небезопасным способом: путём парсинга сообщения.
            // Для исправления требуется улучшить структуру преподавателя чтобы у неё был id. Возможно нужно переделать кеш
            let teacherName = query.message.text!.match(/> (.+?)\n/)?.[1];
            if (!teacherName) return this.errorTeacherError(query);

            let teacher = Teacher.getTeacher(teacherName);
            if (!teacher) return this.errorTeacherError(query);

            let text = await teacher.getTextDayTimetable(dateToday);
            if (!text) return this.errorTimetableUndefined(query);

            await Cache.bot.editMessageText(text, {
                parse_mode: 'HTML',
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Назад", callback_data: `TTT__set__${format(dateYesterday, 'dd.MM.yyyy')}` },
                            { text: "Вперёд", callback_data: `TTT__set__${format(dateTommorow, 'dd.MM.yyyy')}` }
                        ],
                        // [
                        //     { text: "полностью", callback_data: `TTT__showall` },
                        //     { text: "сохранить", callback_data: `TTT__save` }
                        // ]
                    ]
                },
            }).catch((err) => {
                // TODO: Не точно
                if (err.toString() !== "TelegramError: ETELEGRAM: 400 Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message")
                    console.log(err)
                else
                    console.log("Сработало");
            });
        }

        // TODO: 
        // if (whatdo == 'showall') {
        //     return;
        // }
        //
        // if (whatdo == 'save') {
        //     return
        // }
    }
}
