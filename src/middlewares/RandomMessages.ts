import { Message } from "node-telegram-bot-api";
import Middleware from "../structures/Middleware.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";

class SponsorMessagesMiddleware extends Middleware {
    type = Middleware.types.Post;

    users:{id: number, count: number}[] = [];

    messages = [
        "Про ошибки/предложения не стесняйся писать мне в ЛС: @Elektroplayer",
        "Если бот перестал работать, это повод написать мне в ЛС: @Elektroplayer",

        "Нужна кнопка настроек?\n\nЕсли нет, то её можно отключить в /settings",
        "А ты за emoji или против?\n\nВыбери свою сторону в /settings",
        "Настрой автоматическую отправку расписания на завтра после пар в /settings",

        "Если у тебя резко пропали кнопки внизу, напиши /start",
        "Иногда нужно смотреть шире, чем обычно.\n\n/showall покажет расписание полностью",
        "Не можешь запомнить имена преподавателей?\n\nВыведи список преподавателей по команде /teachers",
        "Не забывай про экзамены!\n\nПосмотри дату ближайшего экзамена по команде /exams"
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exec(user: User, msg: Message): any {
        if(msg.chat.type !== "private") return;

        let thisUser = this.users.find(u => u.id == user.id);

        if(!thisUser) {
            this.users.push({
                id: user.id,
                count: 1
            });
        } else if(thisUser.count > 5) {
            let num = Math.floor(Math.random() * this.messages.length);

            console.log(`[message] [+] доп сообщение ${num}.`);

            Cache.bot.sendMessage(msg.chat.id, this.messages[num], { parse_mode: "HTML" });

            thisUser.count = 1;
        } else thisUser.count++;
    }
}

export default new SponsorMessagesMiddleware();