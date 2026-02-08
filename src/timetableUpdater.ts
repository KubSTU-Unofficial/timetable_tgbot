import APIConvertor from './shared/lib/APIConvertor.js';
import mongoose from 'mongoose';
import LessonModel from './shared/models/LessonModel.js';
import GroupModel, { IGroupSchema } from './shared/models/GroupModel.js';
import Group from './shared/structures/Group.js';
import OGroup from './shared/structures/OGroup.js';
import ZGroup from './shared/structures/ZGroup.js';
import bootstrap from './shared/bootstrap.js';

type GroupBulkOperations = mongoose.AnyBulkWriteOperation<IGroupSchema>[] | { updateOne: { filter: { name: string; fakId: number; }; update: { $set: { sem: number; year: number; lessonsStartDate?: Date; lessonsEndDate?: Date; }; }; upsert: boolean; }; }[];
type GroupConstructor<T extends Group> = new (name: string, fakId: number) => T;

// Сделано для определения чётности недели
// Returns the ISO week of the date.
// Source: https://weeknumber.net/how-to/javascript
// Date.prototype.getWeek = function () {
//     let date = new Date(this.getTime());
//     date.setHours(0, 0, 0, 0);
//     date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
//     let week1 = new Date(date.getFullYear(), 0, 4);
//     return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
// };

// mongoose.set('strictQuery', true);
// mongoose.connect(process.env.MONGO_URI)
bootstrap().then(() => {
    new (class Main {
        now = new Date();
        defaultYear = this.now.getFullYear() - (this.now.getMonth() >= 6 ? 0 : 1);
        defaultSem = this.now.getMonth() > 5 ? 1 : 2;

        failedGroups: { name: string, fakId: number }[] = [];

        constructor() {
            let p: Promise<unknown> = Promise.resolve(0);

            if (process.argv.includes('--force'))
                p = p.then(() => {
                    return this.removeAllData();
                });

            p.then(() => {
                return this.updateSchedules({
                    foe: "ofo",
                    label: "очных",
                    GroupClass: OGroup,
                });
            }).then(() => {
                return this.updateSchedules({
                    foe: "zfo",
                    label: "заочных",
                    GroupClass: ZGroup,
                });
            }).then(async () => {
                console.log('Не удалось для: ', this.failedGroups);

                await mongoose.disconnect();
                process.exit(0);
            });
        }

        async removeAllData() {
            return await LessonModel.deleteMany({});
        }

        async buildBulkOperationsForGroup<T extends Group>(groupClass: T, groupBulk: GroupBulkOperations) {
            // Обновление информации о группе
            let groupInfo = await groupClass.getGroupInfoFromAPI()

            if (!groupInfo) groupInfo = groupClass.getGroupInfoDefault();

            groupBulk.push({ // TODO: Мутация внешнего массива - не самый чистый способ. Перед добавлением экзаменов нужно найти более правильный код.
                updateOne: {
                    filter: { name: groupClass.name, fakId: groupClass.instId },
                    update: {
                        $set: {
                            sem: groupInfo.sem,
                            year: groupInfo.year,
                            lessonsStartDate: groupInfo.lessonsPeriod?.[0],
                            lessonsEndDate: groupInfo.lessonsPeriod?.[1],
                            FoE: groupClass.isZFOGroup() ? 3 : 1,
                        }
                    },
                    upsert: true,
                }
            });

            groupClass.sendGroupInfoToCache(groupInfo);

            // Обновление расписания группы
            let out = [];
            let timetable = await groupClass.getTimetableFromAPI();

            if (!timetable) {
                console.log(`[updater] [-] Не удалось получить расписание для ${groupClass.name}`);
                this.failedGroups.push({ name: groupClass.name, fakId: groupClass.instId });
                return [];
            }

            out.push({ deleteMany: { filter: { group: groupClass.name, "timing.semester": groupInfo.sem, "timing.year": groupInfo.year } } });

            out.push(...timetable.map((l) => ({ insertOne: { document: { ...l, group: groupClass.name } } })));

            // TODO: Экзамены

            console.log(`[updater] [+] ${groupClass.name}`);

            return out;
        }

        async updateSchedules<T extends Group>(options: {
            foe: 'ofo' | 'zfo';
            label: string;
            GroupClass: GroupConstructor<T>;
        }) {
            console.log(`[updater] Приступаю к обновлению ${options.label} расписаний!`);
            console.log('[updater] Получаю список групп');

            const resp = await APIConvertor.groupsList(this.defaultYear, { foe: options.foe });

            if (process.argv.includes('--debug')) console.log('[updater] Ответ:', resp);

            if (!resp?.isok) {
                console.log('[updater] Ошибка!', resp);
                return;
            }

            const groups = resp.data.map(g => ({
                name: g.name,
                fakId: g.fakId,
            }));

            const groupBulk: GroupBulkOperations = [];

            const timetableBulk = (await Promise.all(
                groups.map(group => this.buildBulkOperationsForGroup(new options.GroupClass(group.name, group.fakId), groupBulk))
            )).flat();

            if (timetableBulk.length) await LessonModel.bulkWrite(timetableBulk).catch(console.error);
            if (groupBulk.length) await GroupModel.bulkWrite(groupBulk).catch(console.error);
        }
    })();
}, console.log);
