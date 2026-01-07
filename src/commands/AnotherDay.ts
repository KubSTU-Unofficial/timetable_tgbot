import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';

export default class AnotherDayCommand extends Command {
    name = { buttons: { title: 'Выбрать день', emoji: '🔀' } };
    sceneName = ['main'];

    middlewares = [GroupTestMiddleware];

    async exec(user: User, msg: Message): Promise<void> {
        if (msg.chat.type !== 'private') return;
        if (!user.group) return;

        user.setScene('selectDay');

        let keyboard = user.group.selectDayKeyboard();

        Cache.bot.sendMessage(user.id, 'Выбери день на кнопке или впиши дату в формате "ДД.ММ.ГГГГ"', {
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    }
}
