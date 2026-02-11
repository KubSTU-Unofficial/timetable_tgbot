import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class TeachersCommand extends Command {
    name = {
        command: 'teachers',
        buttons: { title: 'Кто что ведёт', emoji: '👨‍🏫' }
    };

    sceneName = ['main', 'tools'];
    middlewares = [GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        let lessons: { [key: string]: { [key: string]: string[] } } = await user.group.getRawTeachersAndDisciplines();
        let out = `<b><u>ПРЕДМЕТЫ И ПРЕПОДАВАТЕЛИ:</u></b>\n\n`;

        if (!lessons || !Object.keys(lessons)?.length) out += "<i>Здесь пусто...</i>"
        else for (let lesson in lessons) {
            out += `<b>${lesson}:</b>`;
            for (let teacher in lessons[lesson]) {
                out += `\n  ${teacher} [${lessons[lesson][teacher].join(', ')}]`;
            }
            out += `\n\n`;
        }

        Cache.bot.sendMessage(msg.chat.id, out, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
                remove_keyboard: msg.chat.type !== 'private'
            },
            disable_web_page_preview: true,
        });

        user.setScene('main');
    }
}
