import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class SelectTeacherCommand extends Command {
    name = {
        buttons: [
            { title: 'Расписания преподавателей', emoji: '👨‍🏫' },
            { title: 'преподаватели', emoji: '' },
        ],
    };

    sceneName = ['main', 'tools'];
    middlewares = [GroupTestMiddleware];

    nameFormat(name: string) {
        let nameArr = name.split(' ');

        return `${nameArr[0]} ${nameArr[1][0]}. ${nameArr[2][0]}.`;
    }

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        user.setScene('teachers');

        let teachers: string[] = await user.group.getRawTeachersList();
        let buttons = teachers.map((name) => ({ text: this.nameFormat(name) }));
        let keyboard: { text: string }[][] = [];

        buttons.forEach((elm, i) => {
            if (keyboard[Math.floor(i / 2)]) keyboard[Math.floor(i / 2)].push(elm);
            else keyboard[Math.floor(i / 2)] = [elm];
        });

        keyboard.push([{ text: (user.emoji ? '🛑 ' : '') + 'Отмена' }]);

        Cache.bot.sendMessage(
            msg.chat.id,
            '<b>Расписание преподавателей</b>\n\nВыбери преподавателя из списка или введи имя, фамилию или отчество:',
            {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard,
                    resize_keyboard: true,
                    remove_keyboard: msg.chat.type !== 'private',
                },
            },
        );
    }
}
