import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import SponsorMessagesMiddleware from '../middlewares/RandomMessages.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';
import { getMonday } from '../shared/lib/Utils.js';

export default class SelectingDayCommand extends Command {
    name = {};
    sceneName = ['selectDay'];
    middlewares = [SponsorMessagesMiddleware, GroupTestMiddleware];

    days = ['Нечёт Пн', 'Нечёт Вт', 'Нечёт Ср', 'Нечёт Чт', 'Нечёт Пт', 'Нечёт Сб', 'Чёт Пн', 'Чёт Вт', 'Чёт Ср', 'Чёт Чт', 'Чёт Пт', 'Чёт Сб'];

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group || msg.chat.type !== 'private' || !msg.text) return;

        user.setScene('main');

        let date = new Date(msg.text);
        let text;

        if (!isNaN(date.valueOf())) text = await user.group.getTextSchedule(date, { showDate: true });
        else {
            let index = this.days.indexOf(msg.text);

            if (index == -1)
                text =
                    'Неверный ввод.\n\n<i>Возможно дата написана неверно. При возникновении проблем обратись <a href="https://t.me/Elektroplayer">сюда</a></i>';
            else {
                let day = (index + 1) % 6 || 6;
                let week = index >= 6;

                // Получаем дату выбранного дня
                date = getMonday(new Date());
                date.setDate(date.getDate() - 1 + day + ((date.getWeek() % 2 == 0) == week ? 0 : 7));

                text = await user.group.getTextSchedule(date, { showDate: true });
            }
        }

        // let text = await user.group.getTextSchedule(date, { showDate: true });

        Cache.bot.sendMessage(msg.chat.id, text, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
            },
            disable_web_page_preview: true,
        });
    }
}
