import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class TodayCommand extends Command {
    name = { command: 'teachers' };
    sceneName = ['main'];
    middlewares = [GroupTestMiddleware];

    nameFormat(name: string) {
        let nameArr = name.split(' ');

        return `${nameArr[0]} ${nameArr[1][0]}. ${nameArr[2][0]}.`;
    }

    buttonFormat(text: string) {
        return { text };
    }

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        let schedule = await user.group.getFullRawSchedule();
        let lessons: { [key: string]: { [key: string]: string[] } } = {};

        if (schedule) {
            schedule.forEach((lesson) => {
                if (!lessons[lesson.disc.disc_name]) lessons[lesson.disc.disc_name] = {};
                if (!lessons[lesson.disc.disc_name][lesson.teacher]) lessons[lesson.disc.disc_name][lesson.teacher] = [];
                if (!lessons[lesson.disc.disc_name][lesson.teacher].includes(lesson.kindofnagr.kindofnagr_name))
                    lessons[lesson.disc.disc_name][lesson.teacher].push(lesson.kindofnagr.kindofnagr_name);
            });
        }

        let out = `<b><u>ПРЕДМЕТЫ И ПРЕПОДАВАТЕЛИ</u></b>\n\n`;

        for (let lesson in lessons) {
            out += `<b>${lesson}:</b>`;
            for (let teacher in lessons[lesson]) {
                out += `\n  ${teacher} [${lessons[lesson][teacher].join(', ')}]`;
            }
            out += `\n\n`;
        }

        Cache.bot.sendMessage(msg.chat.id, out, {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: msg.chat.type !== 'private' },
            disable_web_page_preview: true,
        });
    }
}
