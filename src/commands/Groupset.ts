import { Message } from 'node-telegram-bot-api';
import Command from '../structures/Command.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import GroupModel from '../shared/models/GroupModel.js';

export default class GroupsetCommand extends Command {
    name = {};
    sceneName = ['groupset'];

    async exec(user: User, msg: Message): Promise<unknown> {
        let group = await GroupModel.findOne({ name: msg.text! }).lean().exec();

        if (!group) return Cache.bot.sendMessage(
            msg.chat.id,
            `<b>Искал вдоль и поперёк, но не нашёл такой группы...</b> Уверен в написании? Напиши /start чтобы найти свою группу`,
            {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
            },
        );

        user.updateData({ inst_id: group.fakId, group: group.name });
        user.setScene('main');

        Cache.bot.sendMessage(
            msg.chat.id,
            `<b>Нашёл!</b> Это было быстро.\n\n` +
            `<b>Добро пожаловать в главное меню.</b>\n\n` +
            `Тут можно посмотреть расписание на сегодня, завтра или на определённый день. /showall покажет полное расписание, а /exams даст расписание экзаменов. В инструментах есть прикольные <i>штучки</i>, а в настройках можешь немного изменить интерфейс, включить автоматическую отправку расписания или сменить группу.`,
            {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: user.getMainKeyboard(),
                    resize_keyboard: true,
                },
            },
        )
    }
}
