import { Message, SendMessageOptions } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import Teacher from '../structures/Teacher.js';

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

        let teacher = dict[msg.text!] ? new Teacher(dict[msg.text!]) :  new Teacher(msg.text!);
        let texts = await teacher.getTextFullSchedule();

        if(!texts) return Cache.bot.sendMessage(msg.chat.id, 'Что-то пошло не так, расписание не найдено...', options);

        for (let text of texts) {
            await Cache.bot.sendMessage(msg.chat.id, text, options);
        }
    }
}
