import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import SponsorMessagesMiddleware from '../middlewares/RandomMessages.js';
import { days } from '../shared/lib/Utils.js';
import GroupTestMiddleware from '../middlewares/GroupTestMiddleware.js';
import { IRespOFOPara } from '../shared/lib/APIConvertor.js';

export default class NearestCommand extends Command {
    name = {
        buttons: { title: 'Ближайшее', emoji: '⏩' },
        command: 'nearest',
    };

    sceneName = ['main'];
    middlewares = [SponsorMessagesMiddleware, GroupTestMiddleware];

    async errorMessage(msg: Message) {
        Cache.bot.sendMessage(msg.chat.id, '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>', {
            parse_mode: 'HTML',
            reply_markup: {
                remove_keyboard: msg.chat.type !== 'private',
            },
            disable_web_page_preview: true,
        });

        return;
    }

    async exec(user: User, msg: Message): Promise<void> {
        if (!user.group) return;

        let fullRawSchedule = await user.group.getFullRawSchedule();

        if (!fullRawSchedule || !fullRawSchedule.length) return this.errorMessage(msg);

        let date = new Date(),
            day: number = 0,
            week: boolean = true,
            schedule: IRespOFOPara[] = [],
            eventsText: string | null = null;

        for (let i = 0; i <= 14; i++) {
            day = date.getDay();
            week = date.getWeek() % 2 == 0;
            schedule = fullRawSchedule.filter((p) => p.nedtype.nedtype_id == (week ? 2 : 1) && p.dayofweek.dayofweek_id == day);
            eventsText = await user.group.getTextEvents(date);

            if (schedule.length || eventsText) break;
            else date.setDate(date.getDate() + 1);
        }

        if (!schedule.length && !eventsText) return this.errorMessage(msg);

        let textSchedule = user.group.formatSchedule(schedule, date);
        let text =
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя / ${date.stringDate()}</b>` +
            (!textSchedule ? '\nПар нет! Передохни:з' : textSchedule) +
            (eventsText ? `\n\n${eventsText}` : '');

        Cache.bot.sendMessage(msg.chat.id, text, {
            parse_mode: 'HTML',
            reply_markup: {
                remove_keyboard: msg.chat.type !== 'private',
            },
            disable_web_page_preview: true,
        });
    }
}
