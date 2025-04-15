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

        let replyText = 'Включен режим перенастройки.\n\nКакая у тебя форма обучения?';

        Cache.bot.sendMessage(msg.chat.id, replyText, {
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'ОФО',
                            callback_data: 'settings_fo_ofo',
                        },
                        {
                            text: 'ЗФО',
                            callback_data: 'settings_fo_zfo',
                        },
                    ],
                ],
                remove_keyboard: true,
            },
        });
    }
}
