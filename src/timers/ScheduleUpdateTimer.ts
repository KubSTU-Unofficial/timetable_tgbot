import Timer from "../structures/Timer.js";
import { CronJob } from "cron";
import Parser from "../structures/OLectionsParser.js";
import { groupsParser, insts } from "../lib/Utils.js";
import ScheduleModel from "../models/ScheduleModel.js";
import TeacherScheduleModel from '../models/TeacherScheduleModel.js';

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
        await this.updateSchedules();
        await this.updateTeacherSchedules();
    }

    async updateSchedules() {
        console.log("[updater] Приступаю к обновлению расписаний!");

        let inst_id: number;
        let groups: string[] | undefined;
        let parser: Parser;
        let group: string;
        let days: IDay[] | undefined;
        let bulk = ScheduleModel.collection.initializeOrderedBulkOp();
        let updateDate = new Date();
    
        for(let i=0;i<insts.length;i++) {
            console.log(`[updater] ${insts[i]}:`);
    
            for(let kurs=1;kurs<=6;kurs++) {
                inst_id  = insts[i];
                groups   = undefined; // Очищаем массив групп
    
                try {
                    groups = await groupsParser(inst_id, kurs); // Парсим все группы с сайта
                } catch (err) {
                    console.log(`[updater] [!] Не удалось для ${inst_id}, ${kurs} курс`);
                }
                    
                if(!groups || !groups.length) continue;
    
                for(let g=0;g<groups.length;g++) {
                    group  = groups[g];
                    parser = new Parser(inst_id, kurs, group);
                    days   = undefined; // Очистка
    
                    try {
                        days = await parser.parseSchedule(); // Парсим расписание группы с сайта
                    } catch (err) {
                        console.log(`[updater] [!] Не удалось для ${inst_id} ${kurs} курс, группа ${group}!`);
                    }
    
                    if(!days) continue;
    
                    // console.log(`[updater] [+] ${inst_id}, ${kurs}, ${group}`); // Нужно скорее для дебага
    
                    // Обновляем расписание. Если такой группы нет, она создастся автоматически
                    bulk.find({ group, inst_id }).upsert().updateOne({ $set: { days, updateDate } });
                }
            }
        }

        // Отправляем изменения в БД
        await bulk.execute().then(() => console.log(`[updater] Расписания обновлены!`), console.log);
    }

    async updateTeacherSchedules() {
        console.log(`[updater] Приступаю к обновлению расписаний преподавателей!`);

        let schedules = await ScheduleModel.find({}).exec(); // Получение всех расписаний
        let teachersScheduleDB = await TeacherScheduleModel.find({}).exec(); // Получение всех расписаний учителей
        let teachersSchedule:{[key: string]: ITeacherDay[]} = {}; // Тут будут храниться расписания у преподавателей
        let updateDate = new Date(); // Дата обновления (сейчас)
    
        schedules.forEach((group) => {
            if(!group.days || group.days.length == 0) return; // Если у группы нет пар, значит пропускаем её
    
            group.days.forEach((day) => {
                day.daySchedule.forEach((lesson) => {
                    if(lesson.teacher == "Не назначен") return;
    
                    if(!teachersSchedule[lesson.teacher!]) teachersSchedule[lesson.teacher!] = []; // Создаём для преподавателя массив его дней, если этого массива нет
                    
                    // Переменная содержащая инфу о паре
                    let out:ITeacherLesson = {   
                        group: group.group,
                        number: lesson.number!,
                        time: lesson.time!,
                        name: lesson.name!,
                        paraType: lesson.paraType!,
                        auditory: lesson.auditory!,
                    };
    
                    if(lesson.remark) out.remark = lesson.remark;
                    if(lesson.percent) out.percent = lesson.percent;
                    if(lesson.period) out.period = lesson.period;
                    if(lesson.flow) out.flow = lesson.flow;
                    
                    // Тут добавляем сам день, а если он уже есть, то вставляем в него пару
                    if(!teachersSchedule[lesson.teacher!].find(elm => elm.daynum == day.daynum && elm.even == day.even))
                        teachersSchedule[lesson.teacher!].push({daynum: day.daynum, even: day.even, daySchedule: [out]});
                    else teachersSchedule[lesson.teacher!].find(elm => elm.daynum == day.daynum && elm.even == day.even)!.daySchedule.push(out);
                });
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
