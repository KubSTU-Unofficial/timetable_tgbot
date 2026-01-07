import { InlineKeyboardButton, Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import LessonModel from '../shared/models/LessonModel.js';

export default class TodayCommand extends Command {
    name = { buttons: [{ title: 'Свободная аудитория', emoji: '🔍' }] };
    sceneName = ['tools'];

    async exec(user: User, msg: Message): Promise<void> {
        let classrooms = await LessonModel.find().distinct('classroom').lean().exec(); // Получаем все аудитории
        let buildings = [...new Set(classrooms.map(a => a.split('-')[0]))]; // Получаем все возможные корпуса
        let inline_keyboard: InlineKeyboardButton[][] = [];

        let i = 0;
        buildings.forEach((b) => {
            if (!b) return;
            if (!inline_keyboard[i]) inline_keyboard[i] = [];

            inline_keyboard[i].push({ text: b, callback_data: `audFinder__${b}` });

            if (inline_keyboard[i].length >= 4) i++;
        });

        Cache.bot.sendMessage(msg.chat.id, '<b>Поиск свободных аудиторий</b> (на сегодняшний день)\n\nВыбери корпус:', {
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard,
                resize_keyboard: true,
                // keyboard: user.getMainKeyboard(), // Он не может отправить одновременно 2 кейборда
            },
        });

        user.setScene('main');

        await Cache.bot.sendMessage(msg.chat.id, 'Меню', {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
                remove_keyboard: msg.chat.type !== 'private',
            },
        });
    }
}
