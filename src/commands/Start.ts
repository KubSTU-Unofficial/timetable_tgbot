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
            } else { // TODO: Можно чуть-чуть полирнуть
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
            user.setScene('groupset');
            replytext += 'Для того, чтобы я мог показывать тебе расписание, мне нужно узнать твою группу. Ты можешь или прокликать кнопки ниже, или написать имя группы в чат. Если ты не туда нажал, ты всегда можешь перенастроить бота (Настройки > Перенастроить бота)\n\nКакая у тебя форма обучения?';

            await Cache.bot.sendMessage(msg.chat.id, replytext, {
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

            let linkFAQ = "https://github.com/KubSTU-Unofficial/timetable_tgbot/blob/main/README.md#часто-задаваемые-вопросы"
            await Cache.bot.sendMessage(msg.chat.id, `При возникновении проблем, прочти <a href="${linkFAQ}">F.A.Q.</a>\n` +
                `Если это не помогло, обратись мне в ЛС: <a href="https://t.me/Elektroplayer">тык</a>`, {
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
