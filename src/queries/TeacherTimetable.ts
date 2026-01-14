import { CallbackQuery } from 'node-telegram-bot-api';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import { parse } from 'date-fns';
import Teacher from '../structures/Teacher.js';
import Cache from '../lib/Cache.js';

export default class FinalQuery extends Query {
    name = ['TTT']; // TTT__{whatdo}__{date?}

    async errorTeacherError(query: CallbackQuery) {
        return Cache.bot.editMessageText('Произошла ошибка, преподаватель не найден.\nЕсли это повторяется, обратитесь в <a href="https://t.me/Elektroplayer">поддержку</a>', { // TODO: ссылку
            parse_mode: 'HTML',
            chat_id: query.message!.chat.id,
            message_id: query.message!.message_id,
        }).catch(this.errorCatcher);
    }

    async errorTimetableUndefined(query: CallbackQuery) {
        return Cache.bot.editMessageText('При получении расписания произошла ошибка.\nЕсли это повторяется, обратитесь в <a href="https://t.me/Elektroplayer">поддержку</a>', {
            parse_mode: 'HTML',
            chat_id: query.message!.chat.id,
            message_id: query.message!.message_id,
        }).catch(this.errorCatcher);
    }

    async exec(user: User, query: CallbackQuery): Promise<unknown> {
        if (!query.message) return;

        let [, whatdo, arg2] = query.data?.split('__') ?? [];

        if (whatdo == 'set') {
            let dateToday = parse(arg2, 'dd.MM.yyyy', new Date());

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
                    inline_keyboard: user.getToolsTeacherKeyboard(dateToday)
                },
            }).catch(this.errorCatcher);
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
