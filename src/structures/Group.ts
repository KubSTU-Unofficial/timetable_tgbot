// import OLectionsParser from "./OLectionsParser.js";
import Schedules from "../models/ScheduleModel.js";
import Groups from "../models/GroupsModel.js";
import Events from "../models/EventsModel.js";
import { weekNumber, genToken, days } from "../lib/Utils.js";
import APIConvertor from "../lib/APIConvertor.js";
// import ExamsModel from "../models/ExamsModel.js";

export default class Group {
    kurs: number;
    
    static lessonsTime: string[] = ["what?", "8:00 - 9:30", "9:40 - 11:10", "11:20 - 12:50", "13:20 - 14:50", "15:00 - 16:30", "16:40 - 18:10", "18:20 - 19:50"];
    static lessonsTypes: {[key:string]: string} = {
        "Лекции": "Лекция",
        "Практические занятия": "Практика",
        "Лабораторные занятия": "Лабораторная"
    };

    constructor(public name: string, public instId: number) {
        let year = +(name[0]+name[1]);
        let now  = new Date();

        this.kurs    = now.getUTCFullYear() - 2000 - (now.getUTCMonth() >= 6 ? 0 : 1) - year + 1; // FIXME: Будет работать до 2100 года
    }

    /**
     * Берёт расписание с сайта
     * Если сайт не работает, берёт его с БД
     * Если в БД расписания нет, возвращает undefined
     */
    async getFullRawSchedule() {
        let date  = new Date();
        let ugod  = date.getFullYear() - (date.getMonth() >= 6 ? 0 : 1);
        let sem   = date.getMonth() > 5 ? 1 : 2;

        let resp = await APIConvertor.ofo(this.name, ugod, sem);

        if(!resp || !resp.isok) {
            let dbResponse = await Schedules.findOne({group: this.name}).exec();

            return dbResponse?.data as IOFORespPara[] | undefined;
        } else return resp.data;
    }

    async getDayRawSchedule(day = new Date().getDay(), week = (new Date().getWeek()%2==0)) {
        let fullSchedule = await this.getFullRawSchedule();

        if(!fullSchedule) return undefined;
        else return fullSchedule
        .filter(p => p.nedtype.nedtype_id == (week ? 2 : 1) && p.dayofweek.dayofweek_id == day)
        .sort((a,b) => a.pair - b.pair);
    }


    async getTextSchedule(date = new Date(), opts:{showDate?: boolean} = {}) {
        let day      = date.getDay();
        let week     = date.getWeek()%2 == 0;
        let lessons  = await this.getDayRawSchedule(day, week);

        if(!lessons) return "<b>Во время получения расписания произошла ошибка!</b>\n<i>Возможно стоит обратиться в <a href=\"https://t.me/Elektroplayer\">поддержку</a></i>";

        let out      = "";
        let para     = "";
        let weekNum  = date ? weekNumber(date) : null;

        lessons.forEach(elm => {
            para += `\n\n${elm.pair} пара: ${elm.disc.disc_name} [${Group.lessonsTypes[elm.kindofnagr.kindofnagr_name]}]\n  Время: ${Group.lessonsTime[elm.pair]}`;
            if(elm.teacher) para += `\n  Преподаватель: ${elm.teacher}`;
            if(elm.classroom) para += `\n  Аудитория: ${elm.classroom}`;
            if(elm.persent_of_gr != 100) para += `\n  Процент группы: ${elm.persent_of_gr}%`;
            if(elm.ispotok) para += "\n  В лекционном потоке";
            if(elm.ned_from != 1 || elm.ned_to != 18) para += `\n  Период: c ${elm.ned_from} по ${elm.ned_to} неделю`;
            if(elm.comment) para += `\n  Примечание: ${elm.comment}`;

            if(weekNum && (elm.ned_from > weekNum || elm.ned_to < weekNum)) para = `<i>${para}</i>`;

            out += para;
            para = "";
        });

        return `<b>${days[day]} / ${week ? "Чётная" : "Нечётная"} неделя` + (opts.showDate ? ` / ${date.stringDate()}` : "") + `</b>` + (!out ? "\nПар нет! Передохни:з" : out);
    }

    async getTextFullSchedule(week: boolean, startDate: Date) {
        let schedule = await this.getFullRawSchedule();
        let num = weekNumber(startDate);
        let out = "";
        
        let dict:{[index: string]: string} = {
            "Лекции": "Лек",
            "Практические занятия": "Прак",
            "Лабораторные занятия": "Лаб"
        };
        
        if(schedule == null || schedule == undefined) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        out += `<u><b>${week ? "ЧЁТНАЯ" : "НЕЧЁТНАЯ"} НЕДЕЛЯ${num ? ` | №${num}` : ""}:</b></u>\n`;
        let currWeekLessons:IOFORespPara[] = schedule.filter(elm => elm.nedtype.nedtype_id == (week ? 2 : 1));

        // TODO: Если на неделе нет пар, что будет?
        for(let i = 0;i<7;i++) {
            let curDayLessons = currWeekLessons.filter(p => p.dayofweek.dayofweek_id == i);

            startDate.setDate(startDate.getDate() + 1);

            if(curDayLessons.length) {
                out += `\n<b>${days[i]} | ${startDate.stringDate()}</b>\n`;

                curDayLessons.forEach(lesson => {
                    out += `  ${lesson.pair}. ${lesson.disc.disc_name} [${dict[lesson.kindofnagr.kindofnagr_name] ?? lesson.kindofnagr.kindofnagr_name}] (${lesson.classroom})\n`;
                });
            }
        }

        return out;
    }

    async getTextExams() {
        let date  = new Date();
        let ugod  = date.getFullYear() - (date.getMonth() >= 6 ? 0 : 1);
        let sem   = date.getMonth() > 5 ? 1 : 2;

        // TODO: Вынести в отдельный метод с получением из БД
        let resp = await APIConvertor.exam(this.name, ugod, sem);

        if(!resp || !resp.isok) return undefined;
        if(!resp.data.length) return `У меня нет расписания экзаменов для твоей группы...`;

        let examsText = resp.data.reduce((acc, x) => acc + `<b>${x.time_sd.substring(0,x.time_sd.length-3)} ${x.date_sd} / ${x.disc.disc_name}</b>\n  Преподаватель: ${x.teacher}\n  Аудитория: ${x.classroom}\n\n`, "");

        return `<u><b>РАСПИСАНИЕ ЭКЗАМЕНОВ</b></u>\n\n${examsText}`;
    }

    async getTextEvents(date = new Date()): Promise<string | null> {
        date.setUTCHours(0,0,0,0);

        // События ищутся так, чтобы они или совпадали по дате или были между начальной конечной датой,
        // при этом если у события есть список групп, курсов или институтов, для которых предназначается событие,
        // то группе, под эти критерии не подходящей, событие показываться не будет.
        let filter = {
            $or: [
                {
                    date: date
                }, {
                    startDate: { $lte: date }, endDate: { $gte: date }
                }
            ],
            $and: [
                {
                    $or: [ { groups: undefined }, { groups: this.name } ]
                }, {
                    $or: [ { kurses: undefined }, { kurses: this.kurs } ]
                }, {
                    $or: [ { inst_ids: undefined }, { inst_ids: this.instId } ]
                }
            ]
        };

        let dayEvents = await Events.find(filter);
        let out = dayEvents.reduce((acc, elm, i) => acc + `\n\n${i+1}. <b>${elm.name}</b>` + (elm.note ? `\n  ${elm.note.replace("\n", "\n  ")}` : ""), "");

        return out ? ("<b>СОБЫТИЯ:</b>" + out) : null;
    }


    // async updateScheduleFromSite() {
    //     // TODO: Модель изменилась
    //     let F = (days: IDay[], updateDate = new Date()) => {return {updateDate, days};};

    //     try {
    //         let days = await this.parser.parseSchedule();

    //         await Schedules.findOneAndUpdate({ group: this.name, inst_id: this.instId }, {
    //             days,
    //             updateDate: new Date()
    //         }, { upsert: true });

    //         return F(days);
    //     } catch (error) {
    //         return null;
    //     }
    // }

    
    async getToken():Promise<string> {
        let groupInfo = await Groups.findOne({group: this.name, inst_id: this.instId}).exec();

        if(groupInfo) return groupInfo.token;
        else {
            let token = genToken(this.name, this.instId);

            new Groups({
                group: this.name,
                inst_id: this.instId,
                token
            }).save().catch(console.log);

            return token;
        }
    }
}