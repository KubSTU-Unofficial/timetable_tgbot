import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import { instKeyboard } from '../lib/Keyboards.js';

export default class TodayCommand extends Command {
    name = { buttons: { title: 'Перенастроить бота', emoji: '⚙️' } };
    sceneName = ['settings'];

    async exec(user: User, msg: Message): Promise<void> {
        if (msg.chat.type !== 'private') {
            Cache.bot.sendMessage(msg.chat.id, 'Настройки доступны только в личных сообщениях.');

            return;
        }

        let replyText =
            'Включен режим перенастройки, укажи заново: \n\nКакой у тебя институт. Если твоего тут нет, это повод обратиться <a href="https://t.me/Elektroplayer">мне в ЛС</a>';

        Cache.bot.sendMessage(msg.chat.id, replyText, {
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: instKeyboard,
                remove_keyboard: true,
            },
        });
    }
}
