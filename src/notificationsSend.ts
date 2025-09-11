import mongoose from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import Users from './shared/models/TgUsersModel.js';
import BaseGroup from './shared/structures/Group.js';
import OGroup from './structures/OGroup.js';
import ZGroup from './structures/ZGroup.js';

// Сделано для определения чётности недели
// Returns the ISO week of the date.
// Source: https://weeknumber.net/how-to/javascript
Date.prototype.getWeek = function () {
    let date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    let week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

mongoose.set('strictQuery', true);
mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        return await new (class Main {
            groups: (OGroup | ZGroup)[] = [];
            bot = new TelegramBot(process.env.TOKEN, { polling: false });

            constructor() {}

            getGroup(name: string, instId: number): ZGroup | OGroup {
                let group = this.groups.find((u) => u.name == name);

                if (group) return group;
                else {
                    let newGroup = BaseGroup.isZFOGroup(name) ? new ZGroup(name, instId) : new OGroup(name, instId);

                    this.groups.push(newGroup);

                    return newGroup;
                }
            }

            getLastFinishedLessonIndex(date: Date = new Date()): number | null {
                const now = date.getTime();

                for (let i = BaseGroup.lessonsTime.length - 1; i >= 1; i--) {
                    const [endH, endM] = BaseGroup.lessonsTime[i][1].split(':').map(Number);

                    const endDate = new Date(date);
                    endDate.setHours(endH, endM, 0, 0);

                    if (now >= endDate.getTime()) return i;
                }

                return null; // ничего не завершилось (например, до начала учебного дня)
            }

            async exec() {
                let users = await Users.find({ notifications: true }).lean().exec();

                let dateToday = new Date();
                let dateTomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);

                // DEBUG
                // let testDate = new Date('Mon Apr 14 2025 11:20:55 GMT+0300 (Москва, стандартное время)');
                // let lastFinishedLessonIndex = this.getLastFinishedLessonIndex(testDate);

                let lastFinishedLessonIndex = this.getLastFinishedLessonIndex();

                console.log('[notify] Начинаю отправлять уведомления ');

                await Promise.all(
                    users.map(async (user) => {
                        if (!user.group || !user.inst_id) return;

                        let group = this.getGroup(user.group, user.inst_id);
                        let todaySchedule = await group.getDayRawSchedule(dateToday);
                        let tomorrowSchedule = await group.getDayRawSchedule(dateTomorrow);

                        if (!todaySchedule || !tomorrowSchedule || tomorrowSchedule.length == 0) return;

                        let lastTodayLessonIndex = !todaySchedule.length ? 1 : todaySchedule[todaySchedule.length - 1].number;

                        console.log(lastTodayLessonIndex, lastFinishedLessonIndex);

                        if (lastTodayLessonIndex !== lastFinishedLessonIndex) return;

                        console.log(`[notify] ${user.userId}, ${user.group}`);

                        let text = await group.getTextSchedule(dateTomorrow);
                        let events = await group.getTextEvents(dateTomorrow);
                        if (events) text += `\n\n${events}`;

                        await this.bot.sendMessage(user.userId, text, { parse_mode: 'HTML' }).catch((err) => {
                            if (
                                [
                                    // 50 оттенков "Не могу отправить сообщение"
                                    'Error: ETELEGRAM: 403 Forbidden: bot was blocked by the user',
                                    'Error: ETELEGRAM: 400 Bad Request: chat not found',
                                    'Error: ETELEGRAM: 403 Forbidden: user is deactivated',
                                ].includes(`${err}`)
                            ) {
                                console.log(`[notify] Chat not found or was deleted, or bot was blocked by ${user.userId}`);
                                console.log(`[notify] ${err}`);
                                // user.delete();
                            } else {
                                console.log(`[notify] "${err}"`);
                                console.log(err);
                            }
                        });
                    }),
                );

                const pending = this.groups
                .map(g => (g as unknown as { pendingUpdate?: Promise<unknown> }).pendingUpdate)
                .filter(Boolean);

                if (pending.length) {
                    console.log(`[notify] Несколько групп (${pending.length}) ещё не закончили обновление. Ожидаем...`);
                    await Promise.allSettled(pending);
                }
                return await mongoose.disconnect();
            }
        })().exec();
    }, console.log);
