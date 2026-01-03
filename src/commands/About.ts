import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';

export default class AboutCommand extends Command {
    name = { command: 'about' };
    sceneName = [];

    async exec(user: User, msg: Message): Promise<void> {
        user.setScene('main');

        const username = msg.from?.username ?? 'пользователь';

        Cache.bot.sendMessage(
            msg.chat.id,
            `<b>Приветствую, ${username}</b>\n\n` +
            `Это официальный чат-бот с расписанием Кубанского государственного технологического университета.\n\n` +
            `Здесь ты сможешь следить за расписанием и экзаменами своей группы, а также преподавателей!\n\n` +
            `Все официальные каналы КубГТУ: kubstu.ru/links\n` +
            `По вопросам работы чат-бота: @Elektroplayer\n` +
            `Исходный код: github.com/KubSTU-Unofficial/timetable_tgbot\n\n` +
            `Разработано Управлением информатизации и студентом кафедры информатики и вычислительной техники института КСиИБ КубГТУ 💙`,
            {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                },
            },
        );
    }
}
