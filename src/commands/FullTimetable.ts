import { Message, SendMessageOptions } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';
import { getMonday } from '../shared/lib/Utils.js';

export default class TodayCommand extends Command {
    name = { command: 'showall' };
    sceneName = ['main'];
    middlewares = [GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        let curMonday = getMonday(new Date());
        let texts = await user.group.getTextFullSchedule(curMonday);

        let opt: SendMessageOptions = {
            parse_mode: 'HTML',
            reply_markup: {
                remove_keyboard: msg.chat.type !== 'private',
            },
            disable_web_page_preview: true,
        };

        if (!texts) Cache.bot.sendMessage(msg.chat.id, '<b>Расписание не найдено...</b> <i>или что-то пошло не так...</i>', opt);
        else {
            for (let text of texts) {
                await Cache.bot.sendMessage(msg.chat.id, text, opt);
            }
        }
    }
}
