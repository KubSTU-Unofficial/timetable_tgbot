import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import Teacher from '../structures/Teacher.js';

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
        if (!msg.text) return;

        let teacher: Teacher | undefined;

        for (let teacherName of await user.group!.getRawTeachersList()) {
            if (this.nameFormat(teacherName) == msg.text) {
                teacher = Teacher.getTeacher(teacherName);
                break;
            }
        }

        if (!teacher) {
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

        let text = await teacher.getTextDayTimetable(dateToday);
        if (!text) return this.errorTimetableUndefined(msg.chat.id, user);

        await Cache.bot.sendMessage(msg.chat.id, text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: user.getToolsTeacherKeyboard(dateToday),
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
