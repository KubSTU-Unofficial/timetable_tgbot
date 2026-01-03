import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import AboutCommand from './About.js';

export default class StartCommand extends Command {
    name = { command: 'start' };
    sceneName = [];

    async exec(user: User, msg: Message): Promise<void> {
        const username = msg.from?.username ?? 'пользователь';
        let replytext = `<b>Приветствую, ${username}</b>\n\n`;

        if (msg.chat.type !== 'private') {
            if (!user.group) {
                replytext += 'Конкретно у тебя не установлена некоторая важная для меня информация. Давай поговорим в личных сообщениях.';
            } else {
                replytext +=
                    'Можешь воспользоваться командами снизу:\n\n/today - Расписание на сегодня\n/tomorrow - Расписание на завтра\n/nearest - Ближайшее расписание\n/about - Информация о боте';
            }

            Cache.bot.sendMessage(msg.chat.id, replytext, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
            return;
        }

        if (!user.group) {
            user.scene = Cache.scenes.find((s) => s.name == 'settings');
            replytext += 'У тебя не установлена некоторая важная для меня информация. Подскажи пожалуйста,\n\nКакая у тебя форма обучения?';

            Cache.bot.sendMessage(msg.chat.id, replytext, {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'ОФО', callback_data: 'settings__ofo' },
                            { text: 'ЗФО', callback_data: 'settings__zfo' },
                        ],
                    ],
                    resize_keyboard: true,
                },
            });

            Cache.bot.sendMessage(msg.chat.id, `При возникновении проблем, прочтите <a href="https://github.com/KubSTU-Unofficial/timetable_tgbot/blob/main/README.md#%D1%87%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B">F.A.Q.</a>\nЕсли оно не помогло, обратитесь мне в ЛС: <a href="https://t.me/Elektroplayer">тык</a>`, {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
            });
        } else {
            // Если у пользователя уже есть группа, просто показываем ему информацию о боте
            const aboutCommand = new AboutCommand();
            await aboutCommand.exec(user, msg);
        }
    }
}
