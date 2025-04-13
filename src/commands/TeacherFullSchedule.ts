import { Message, SendMessageOptions } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import Teacher from '../structures/Teacher.js';
import { getMonday } from '../shared/lib/Utils.js';

export default class TodayCommand extends Command {
    name = {};
    sceneName = ['teachers'];

    nameFormat(name: string) {
        let nameArr = name.split(' ');

        return `${nameArr[0]} ${nameArr[1][0]}. ${nameArr[2][0]}.`;
    }

    async exec(user: User, msg: Message): Promise<unknown> {
        user.setScene('main');

        let dict: { [key: string]: string } = {};
        for (let teacher of await user.group!.getRawTeachersList()) {
            dict[this.nameFormat(teacher)] = teacher;
        }

        let options: SendMessageOptions = {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
                remove_keyboard: msg.chat.type !== 'private',
            },
        };

        let teacher = new Teacher();

        await teacher.getSchedule([dict[msg.text!], msg.text!]);

        if (!teacher.schedule)
            return Cache.bot.sendMessage(msg.chat.id, 'Я не знаю такого преподавателя. Проверь всё ли верно ты написал и попробуй ещё раз', options);

        let curMonday = getMonday(new Date());
        let nextMonday = new Date(curMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        let schedule1 = teacher.getTextFullSchedule(curMonday);
        let schedule2 = teacher.getTextFullSchedule(nextMonday);

        // TODO: Сделай уже с этим что-нибудь!
        if ((schedule1 && schedule1?.length > 4096) || (schedule2 && schedule2?.length > 4096))
            return await Cache.bot.sendMessage(
                msg.chat.id,
                `<b>Извини, у этого преподавателя слишком большое расписание</b>\n\nЯ уже работаю над этой проблемой`,
                options,
            );

        if (schedule1) await Cache.bot.sendMessage(msg.chat.id, schedule1, options);
        if (schedule2) await Cache.bot.sendMessage(msg.chat.id, schedule2, options);
    }
}
