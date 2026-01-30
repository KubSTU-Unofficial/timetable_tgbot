import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';

export default class TodayCommand extends Command {
    name = { buttons: { title: 'Перенастроить бота', emoji: '⚙️' } };
    sceneName = ['settings'];

    async exec(user: User, msg: Message): Promise<void> {
        if (msg.chat.type !== 'private') {
            Cache.bot.sendMessage(msg.chat.id, 'Настройки доступны только в личных сообщениях.');

            return;
        }

        user.setScene('groupset');

        let replyText = '<b>Включен режим перенастройки</b>\n\n' +
            'Ты можешь или прокликать кнопки ниже, или написать имя группы в чат. Если ты не туда нажал, ты всегда можешь перенастроить бота (Настройки > Перенастроить бота)\n\nКакая у тебя форма обучения?';

        await Cache.bot.sendMessage(msg.chat.id, replyText, {
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'ОФО',
                            callback_data: 'settings__ofo',
                        },
                        {
                            text: 'ЗФО',
                            callback_data: 'settings__zfo',
                        },
                    ],
                ],
                remove_keyboard: true,
            },
        });

        await Cache.bot.sendMessage(msg.chat.id, `При возникновении проблем, прочтите <a href="https://github.com/KubSTU-Unofficial/timetable_tgbot/blob/main/README.md#%D1%87%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B">F.A.Q.</a>\nЕсли оно не помогло, обратитесь мне в ЛС: <a href="https://t.me/Elektroplayer">тык</a>`, {
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: (user.emoji ? '🛑 ' : '') + 'Отмена' }]],
                one_time_keyboard: true,
                resize_keyboard: true,
            }
        });
    }
}
