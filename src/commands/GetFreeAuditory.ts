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

        Cache.bot.sendMessage(msg.chat.id, '<b>Поиск свободных аудиторий</b>\n<i>Этот инструмент может совершать ошибки.<a href="https://github.com/KubSTU-Unofficial/timetable_tgbot?tab=readme-ov-file#%D1%87%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B">Подробнее тут</a>.</i>\n\nВыбери корпус:', {
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard,
                resize_keyboard: true,
                // keyboard: user.getMainKeyboard(), // Он не может отправить одновременно 2 кейборда
            },
        });
    }
}
