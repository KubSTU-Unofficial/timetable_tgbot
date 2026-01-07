import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class ToolsCommand extends Command {
    name = {
        buttons: { title: 'Инструменты', emoji: '🛠' },
        command: 'tools',
    };

    sceneName = ['main'];
    middlewares = [GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<unknown> {
        if (!user.group) return;
        if (msg.chat.type !== 'private') return Cache.bot.sendMessage(msg.chat.id, 'Инструменты доступны только в личных сообщениях.');

        user.setScene('tools');

        Cache.bot.sendMessage(msg.chat.id, '<b>Добро пожаловать в меню превосходства над обычным расписанием!</b>\n' +
            '<i>Инструменты могут быть неточными! <a href="https://github.com/KubSTU-Unofficial/timetable_tgbot?tab=readme-ov-file#%D1%87%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B">Подробнее тут</a>.</i>',
            {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                    keyboard: user.getToolsKeyboard(),
                    remove_keyboard: true,
                    resize_keyboard: true,
                    //one_time_keyboard: true
                },
            }
        );
    }
}
