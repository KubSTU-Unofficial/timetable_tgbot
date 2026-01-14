import { CallbackQuery } from 'node-telegram-bot-api';
import Query from '../structures/Query.js';
import User from '../structures/User.js';
import Cache from '../lib/Cache.js';
import lessonModel from '../shared/models/LessonModel.js';

function arrayDifference<T>(arr1: T[], arr2: T[]): T[] {
    const set2 = new Set(arr2);
    return arr1.filter(item => !set2.has(item));
}

const cachedAnswers: Map<string, { data: ({ _id: number, classrooms: string[] })[], createdAt: Date }> = new Map();

async function getOccupiedClassrooms(building: string) {
    let now = new Date();
    let now0 = new Date(now.setHours(0, 0, 0, 0))
    let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let cachedOccupiedClassrooms = cachedAnswers.get(building);

    if (cachedOccupiedClassrooms
        && now.valueOf() - cachedOccupiedClassrooms.createdAt.valueOf() < 1000 * 60 * 60 * 4
        && cachedOccupiedClassrooms.createdAt >= startOfToday
    ) return cachedOccupiedClassrooms.data;

    let occupiedClassrooms: ({ _id: number, classrooms: string[] })[] = await lessonModel.aggregate([
        {
            $match: {
                $or: [
                    {
                        'timing.weeks.type': now.getWeek() % 2 == 0,
                        'timing.weeks.dayOfWeek': now.getDay(),
                        'timing.weeks.startDate': { $lte: now },
                        'timing.weeks.endDate': { $gte: now },
                    },
                    {
                        'timing.date': now0
                    }
                ],
                classroom: { $regex: `^${building}-` },
            },
        },
        {
            $group: {
                _id: '$timing.lessonNumber', // группируем по номеру пары
                classrooms: { $addToSet: '$classroom' }, // уникальные аудитории
            },
        },
        {
            $sort: { _id: 1 }, // сортируем по номеру пары
        },
    ]);

    cachedAnswers.set(building, {
        data: occupiedClassrooms,
        createdAt: now,
    });

    return occupiedClassrooms;
}


export default class FinalQuery extends Query {
    name = ['audFinder'];
    sceneName = 'main';

    async exec(user: User, query: CallbackQuery): Promise<void> {
        if (!query.message) return;

        let [, building, arg2] = query.data?.split('__') ?? [];
        let number = !arg2 ? 1 : +arg2;

        let allClassrooms = await lessonModel.distinct('classroom', { classroom: { $regex: `^${building}-` } });

        let occupiedClassrooms = (await getOccupiedClassrooms(building)).find(g => g._id == number)?.classrooms ?? [];
        let freeClassrooms = arrayDifference(allClassrooms, occupiedClassrooms);
        let text = freeClassrooms.join('; ');

        const makeBtn = (text: string, suffix: number) => ({
            text,
            callback_data: `audFinder__${building}__${suffix}`,
        });

        const keyboard: { text: string, callback_data: string }[][] = [[]];
        if (number > 1) keyboard[0].push(makeBtn('Предыдущая', number - 1));
        if (number < 8) keyboard[0].push(makeBtn('Следующая', number + 1));

        Cache.bot.editMessageText(
            `<b>Поиск свободных аудиторий</b> (на сегодняшний день)\n\n${number} пара:\n\n` + text,
            {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: keyboard,
                },
            },
        ).catch(this.errorCatcher);
    }
}
