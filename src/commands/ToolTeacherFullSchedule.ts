import { Message, SendMessageOptions } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import Teacher from '../structures/Teacher.js';
import { format } from 'date-fns';

export default class TodayCommand extends Command {
    name = {};
    sceneName = ['teachers'];

    nameFormat(name: string) {
        let nameArr = name.split(' ');

        return `${nameArr[0]} ${nameArr[1][0]}. ${nameArr[2][0]}.`;
    }

    async errorUnknownTeacher(chatId: number, user: User) {
        return Cache.bot.sendMessage(chatId, 'Я не знаю такого преподавателя... Попробуй написать его имя точнее.', {
            parse_mode: 'HTML',
        });
    }

    async errorTimetableUndefined(chatId: number, user: User) {
        return Cache.bot.sendMessage(chatId, 'При получении расписания произошла ошибка.\nЕсли это повторяется, обратитесь в тех. поддержку (/about)', {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
            },
        });
    }

    async exec(user: User, msg: Message): Promise<unknown> {
        let dict: { [key: string]: string } = {}; // TODO: Разбраться. На первый взгляд тут можно избавиться от словаря
        for (let teacher of await user.group!.getRawTeachersList()) {
            dict[this.nameFormat(teacher)] = teacher;
        }

        let teacher: Teacher | undefined;

        if (dict[msg.text!]) teacher = Teacher.getTeacher(dict[msg.text!]);
        else {
            let searchResult = await Teacher.searchTeacher(msg.text!);

            if (!searchResult.length) return this.errorUnknownTeacher(msg.chat.id, user);
            else if (searchResult.length == 1) teacher = Teacher.getTeacher(searchResult[0]);
            else return Cache.bot.sendMessage(msg.chat.id, 'Я нашёл несколько вариантов. Выбери один:', {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [...searchResult.map((name) => ([{ text: name }])), [{ text: (user.emoji ? '🛑 ' : '') + 'Отмена' }]],
                    resize_keyboard: true,
                    remove_keyboard: msg.chat.type !== 'private',
                },
            });
        }

        if (!teacher) return this.errorUnknownTeacher(msg.chat.id, user);

        let dateToday = new Date();
        let dateTommorow = new Date(dateToday.valueOf() + 1000 * 60 * 60 * 24);
        let dateYesterday = new Date(dateToday.valueOf() - 1000 * 60 * 60 * 24);

        if (dateTommorow.getDay() == 0) dateTommorow = new Date(dateTommorow.valueOf() + 1000 * 60 * 60 * 24);
        if (dateYesterday.getDay() == 0) dateYesterday = new Date(dateYesterday.valueOf() - 1000 * 60 * 60 * 24);

        let text = await teacher.getTextDayTimetable(dateToday);

        if (!text) return this.errorTimetableUndefined(msg.chat.id, user);

        await Cache.bot.sendMessage(msg.chat.id, text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [ // TODO: добавить сюда смайлы
                    [
                        { text: "Назад", callback_data: `TTT__set__${format(dateYesterday, 'dd.MM.yyyy')}` },
                        { text: "Вперёд", callback_data: `TTT__set__${format(dateTommorow, 'dd.MM.yyyy')}` },
                    ],
                    // [
                    //     { text: "Полностью", callback_data: `TTT__showall` },
                    //     { text: "Cохранить", callback_data: `TTT__save` },
                    // ]
                ],
                // keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
                remove_keyboard: msg.chat.type !== 'private',
            },
        });

        user.setScene('main');

        await Cache.bot.sendMessage(msg.chat.id, 'Меню', {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
                remove_keyboard: msg.chat.type !== 'private',
            },
        });
    }
}
