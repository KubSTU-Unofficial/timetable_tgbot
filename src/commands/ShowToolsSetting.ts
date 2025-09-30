import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';

export default class ShowTeachersCommand extends Command {
    name = {
        buttons: [
            { title: 'Убрать инструменты', emoji: '⚙️' },
            { title: 'Показать инструменты', emoji: '⚙️' },
        ],
    };

    sceneName = ['settings'];

    async exec(user: User, msg: Message): Promise<void> {
        let showTools = Command.commandName({ buttons: { title: 'Показать инструменты', emoji: '⚙️' } }).includes(msg.text!);

        await user.updateData({ showTools });
        user.setScene('main');

        Cache.bot.sendMessage(
            msg.chat.id,
            showTools
                ? `В меню теперь показываются инструменты`
                : `Инструменты убраны из меню.\n\nВернуть кнопку обратно можно в /settings.`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                    //one_time_keyboard: true
                },
            },
        );
    }
}
