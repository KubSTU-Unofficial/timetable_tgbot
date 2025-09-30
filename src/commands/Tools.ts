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

        Cache.bot.sendMessage(msg.chat.id, 'Добро пожаловать в меню превосходства над обычным расписанием', {
            reply_markup: {
                keyboard: user.getToolsKeyboard(),
                remove_keyboard: true,
                resize_keyboard: true,
                //one_time_keyboard: true
            },
        });
    }
}
