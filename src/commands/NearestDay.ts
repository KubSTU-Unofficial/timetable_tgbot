import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import SponsorMessagesMiddleware from '../middlewares/RandomMessages.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class NearestCommand extends Command {
    name = {
        buttons: { title: 'Ближайшее', emoji: '⏩' },
        command: 'nearest',
    };

    sceneName = ['main'];
    middlewares = [SponsorMessagesMiddleware, GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        Cache.bot.sendMessage(msg.chat.id, await user.group.getTextNextSchedule(), {
            parse_mode: 'HTML',
            reply_markup: {
                remove_keyboard: msg.chat.type !== 'private',
            },
            disable_web_page_preview: true,
        });
    }
}
