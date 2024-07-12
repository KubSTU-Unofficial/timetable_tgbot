import Timer from "../structures/Timer.js";
import { CronJob } from "cron";
import ScheduleModel from "../shared/models/ScheduleModel.js";
import APIConvertor from "../shared/lib/APIConvertor.js";
import TeacherScheduleModel from '../shared/models/TeacherScheduleModel.js';
import Group from '../structures/Group.js';

export default class UpdaterTimer extends Timer {
    async init() {
        new CronJob('0 59 23 * * 3,6', this.exec, null, true, 'Europe/Moscow', this); // В среду и субботу в 23:59
        // new CronJob('0 */5 * * * *', this.exec, null, true, 'Europe/Moscow', this); // Каждые пять минут
    }

    compare(lesson1:ITeacherLesson, lesson2:ITeacherLesson) {
        return lesson1.number == lesson2.number &&
        lesson1.time == lesson2.time &&
        lesson1.name == lesson2.name &&
        lesson1.paraType == lesson2.paraType &&
        lesson1.auditory == lesson2.auditory &&
        lesson1.period == lesson2.period;
    }
    
    combine(lesson1:ITeacherLesson, lesson2:ITeacherLesson) {
        let out:ITeacherLesson = {...lesson1};
    
        out.group = `${lesson1.group} | ${lesson2.group}`;
    
        return out;
    }

    async exec() {
        this.updateSchedules().then(() => {
            this.updateTeacherSchedules();
        });
    }

    async updateSchedules() {
        console.log("[updater] Приступаю к обновлению расписаний!");
        console.log("[updater] Получаю список групп");

        let now = new Date();
        let ugod  = now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1);
        let sem   = now.getMonth() > 5 ? 1 : 2;

        let resp = await APIConvertor.ofoGroupsList(ugod);

        console.log(`[updater] Ответ:`, resp);

        if(!resp || !resp.isok) return console.log("[updater] Ошибка!", resp?.error_message);

        let groups = resp.data.map(g => ({name: g.name, inst_id: g.inst_id}));
        let bulk = ScheduleModel.collection.initializeOrderedBulkOp();

        // Преобразует массив из строк в массив из обещаний, которые потом одновременно исполняются.
        await Promise.all(groups.map((group) => async function () {
            let schedule = await APIConvertor.ofo(group.name, ugod, sem);

            if(!schedule || !schedule.isok) return console.log(`[updater] [-] Не удалось для ${group.name}`);

            bulk.find({ group: group.name, inst_id: group.inst_id }).upsert().updateOne({ $set: { data: schedule.data, updateDate: now } });
            
            console.log(`[updater] [+] ${group.name}`);
        }())).then(async () => {
            await bulk.execute().then(() => console.log(`[updater] Расписания обновлены!`), console.log); // Отправляем изменения в БД
        });
    }

    async updateTeacherSchedules() {
        console.log(`[updater] Приступаю к обновлению расписаний преподавателей!`);

        let schedules = await ScheduleModel.find({}).exec(); // Получение всех расписаний
        let teachersScheduleDB = await TeacherScheduleModel.find({}).exec(); // Получение всех расписаний учителей
        let teachersSchedule:{[key: string]: ITeacherDay[]} = {}; // Тут будут храниться расписания у преподавателей
        let updateDate = new Date(); // Дата обновления (сейчас)
    
        schedules.forEach((group) => {
            if(!group.data || group.data.length == 0) return; // Если у группы нет пар, значит пропускаем её
    
            group.data.forEach((lesson) => {
                if(lesson.teacher == "Не назначен") return;

                if(!teachersSchedule[lesson.teacher!]) teachersSchedule[lesson.teacher!] = []; // Создаём для преподавателя массив его дней, если этого массива нет
                
                // Переменная содержащая инфу о паре
                let out:ITeacherLesson = {
                    group: group.group,
                    number: lesson.pair!,
                    time: Group.lessonsTime[lesson.pair!]!,
                    name: lesson.disc?.disc_name!,
                    paraType: Group.lessonsTypes[lesson.kindofnagr?.kindofnagr_name!]!,
                    auditory: lesson.classroom!,
                };

                if(lesson.comment) out.remark = lesson.comment;
                if(lesson.persent_of_gr != 100) out.percent = `${lesson.persent_of_gr}%`;
                if(lesson.ned_from != 1 || lesson.ned_to != 18) out.period = `c ${lesson.ned_from} по ${lesson.ned_to} неделю`;
                if(lesson.ispotok) out.flow = lesson.ispotok;
                
                // Тут добавляем сам день, а если он уже есть, то вставляем в него пару
                if(!teachersSchedule[lesson.teacher!].find(elm => elm.daynum == lesson.dayofweek?.dayofweek_id && elm.even == (lesson.nedtype?.nedtype_id == 2)))
                    teachersSchedule[lesson.teacher!].push({daynum: lesson.dayofweek?.dayofweek_id!, even: (lesson.nedtype?.nedtype_id == 2), daySchedule: [out]});
                else teachersSchedule[lesson.teacher!].find(elm => elm.daynum == lesson.dayofweek?.dayofweek_id && elm.even == (lesson.nedtype?.nedtype_id == 2))!.daySchedule.push(out);
            });
        });

        // Обновляем БД
        let bulk = TeacherScheduleModel.collection.initializeOrderedBulkOp();

        // Находим учителей, которых не оказалось в расписании
        let teacherNames = Object.keys(teachersSchedule);
        let absentTeachers = teachersScheduleDB.map(elm => elm.name).filter(elm => !teacherNames.includes(elm));

        // Удаляем тех, кого нет
        if(absentTeachers.length) bulk.find({name: {$in: absentTeachers}}).delete();

        for(let teacher in teachersSchedule) {
            // Сортируем по дням недели
            teachersSchedule[teacher].sort((a, b) => a.daynum - b.daynum);

            for(let day in teachersSchedule[teacher]) {
                // Сортируем по номерам пар
                teachersSchedule[teacher][day].daySchedule.sort((a, b) => a.number - b.number);
    
                // Объединение одинаковых пар
                for(let i = 0; i<teachersSchedule[teacher][day].daySchedule.length-1; i++) {
                    if(this.compare(teachersSchedule[teacher][day].daySchedule[i], teachersSchedule[teacher][day].daySchedule[i+1])) {
                        teachersSchedule[teacher][day].daySchedule[i] = this.combine(teachersSchedule[teacher][day].daySchedule[i], teachersSchedule[teacher][day].daySchedule[i+1]);
                        teachersSchedule[teacher][day].daySchedule.splice(i + 1, 1);
                    }
                }
            }
    
            bulk.find({ name: teacher }).upsert().updateOne({$set: { updateDate, days: teachersSchedule[teacher] }});
        }

        await bulk.execute().then(() => console.log(`[updater] Расписания преподавателей обновлены!`), console.log);
    }
}
