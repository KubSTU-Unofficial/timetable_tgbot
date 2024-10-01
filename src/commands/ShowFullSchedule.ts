import { Message, SendMessageOptions } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class TodayCommand extends Command {
    name = { command: 'showall' };
    sceneName = ['main'];
    middlewares = [GroupTestMiddleware];

    /**
    Возвращает понедельник заданной недели. Если заданная неделя это воскресенье, то вернёт следующий понедельник.
    */
    getMonday(oldDate: Date) {
        let date = new Date(oldDate);
        date.setDate(date.getDate() - (date.getDay() == 7 ? 0 : date.getDay()) + 1);
        return date;
    }

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        let curMonday = this.getMonday(new Date());
        let nextMonday = new Date(curMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        let schedule1 = await user.group.getTextFullSchedule(curMonday.getWeek() % 2 == 0, curMonday);
        let schedule2 = await user.group.getTextFullSchedule(nextMonday.getWeek() % 2 == 0, nextMonday);

        let opt: SendMessageOptions = {
            parse_mode: 'HTML',
            reply_markup: {
                remove_keyboard: msg.chat.type !== 'private',
            },
            disable_web_page_preview: true,
        };

        if (!schedule1 || !schedule2) {
            Cache.bot.sendMessage(msg.chat.id, '<b>Расписание не найдено...</b> <i>или что-то пошло не так...</i>', opt);

            return;
        } else {
            await Cache.bot.sendMessage(msg.chat.id, schedule1, opt);
            await Cache.bot.sendMessage(msg.chat.id, schedule2, opt);
        }
    }
}
