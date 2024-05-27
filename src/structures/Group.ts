import OLectionsParser from "./OLectionsParser.js";
import Schedules from "../models/ScheduleModel.js";
import Groups from "../models/GroupsModel.js";
import Events from "../models/EventsModel.js";
import { weekNumber, genToken } from "../lib/Utils.js";
// import ExamsModel from "../models/ExamsModel.js";

export default class Group {
    kurs: number;
    parser: OLectionsParser;

    constructor(public name: string, public instId: number) {
        let year = +(name[0]+name[1]);
        let now  = new Date();

        this.kurs    = now.getUTCFullYear() - 2000 - (now.getUTCMonth() >= 6 ? 0 : 1) - year + 1; // FIXME: Будет работать до 2100 года
        this.parser  = new OLectionsParser(instId, this.kurs, name);
    }

    /**
     * Ищет расписание.
     * Если оно есть в БД и оно не устарело, устанавливает его.
     * Если оно есть в БД, но оно устарело, парсит информацию с сайта и обновляет расписание в БД (при этом если сайт не работает, даёт что есть ничего не обновляя).
     * Если записи в БД нет, парсит расписание и создаёт запись в БД.
     * Если сайт не работает и в БД записей нет, выдаёт null.
     */
    async getFullRawSchedule() {
        let F = (days: IDay[], updateDate = new Date()) => {return {updateDate, days};};
        let dbResponse = await Schedules.findOne({group: this.name, inst_id: this.instId}).exec();

        if( dbResponse && new Date().valueOf() - dbResponse.updateDate?.valueOf()! < 1000 * 60 * 60 * 24 * 7)
            return F(dbResponse.days as IDay[], dbResponse.updateDate);

        try {
            let days = await this.parser.parseSchedule();

            await Schedules.findOneAndUpdate({ group: this.name, inst_id: this.instId }, {
                days,
                updateDate: new Date()
            }, { upsert: true }).catch(console.log);

            return F(days);
        } catch (err) {
            if(dbResponse) return F(dbResponse.days as IDay[], dbResponse.updateDate!);
            return null;
        }
    }

    async getDayRawSchedule(day = new Date().getDay(), week = new Date().getWeek()%2==0) {
        let schedule = await this.getFullRawSchedule();
        
        if(!schedule) return null;

        return schedule.days.find(elm => elm.daynum == day && elm.even == week)?.daySchedule ?? [];
    }


    async getTextSchedule(date = new Date(), opts:{showDate?: boolean} = {}) {
        let day = date.getDay();
        let week = date.getWeek()%2 == 0;
        
        let out = "";
        let para = "";
        let daySchedule = await this.getDayRawSchedule(day, week);
        let weekNum = date ? weekNumber(date) : null;

        if(daySchedule == null) return "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        daySchedule.forEach(elm => {
            para += `\n\n${elm.number} пара: ${elm.name} [${elm.paraType}]\n  Время: ${elm.time}`;
            if(elm.teacher) para += `\n  Преподаватель: ${elm.teacher}`;
            if(elm.auditory) para += `\n  Аудитория: ${elm.auditory}`;
            if(elm.percent) para += `\n  Процент группы: ${elm.percent}`;
            if(elm.flow) para += "\n  В лекционном потоке";
            if(elm.period) para += `\n  Период: ${elm.period}`;
            if(elm.remark) para += `\n  Примечание: ${elm.remark}`;

            if(elm.period && weekNum) {
                let period = [+elm.period.split(" ")[1], +elm.period.split(" ")[3]];

                if(period[0] > weekNum || period[1] < weekNum) para = `<i>${para}</i>`;
            }

            out += para;
            para = "";
        });

        return `<b>${this.parser.days[day]} / ${week ? "Чётная" : "Нечётная"} неделя` + (opts.showDate ? ` / ${date.stringDate()}` : "") + `</b>` + (!out ? "\nПар нет! Передохни:з" : out);
    }

    async getTextFullSchedule(week: boolean, startDate: Date) {
        let schedule = await this.getFullRawSchedule();
        let num = weekNumber(startDate);
        let out = "";
        
        let dict:{[index: string]: string} = {
            "Лабораторная": "Лаб",
            "Практика": "Прак",
            "Лекция": "Лек"
        };
        
        if(schedule == null || schedule == undefined) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        out += `<u><b>${week ? "ЧЁТНАЯ" : "НЕЧЁТНАЯ"} НЕДЕЛЯ${num ? ` | №${num}` : ""}:</b></u>\n`;
        schedule.days.filter(elm => elm.even == week).forEach((day, i, arr) => {
            out += `\n<b>${this.parser.days[day.daynum]} | ${startDate.stringDate()}</b>\n`;
            
            day.daySchedule.forEach(lesson => {
                out += `  ${lesson.number}. ${lesson.name} [${dict[lesson.paraType] ?? lesson.paraType}] (${lesson.auditory})\n`;
            });

            if(arr[i+1]) startDate.setDate(startDate.getDate() + (arr[i+1].daynum - day.daynum));
        });

        return out;
    }

    // async getTextExams() {
    //     let exams = (await ExamsModel.findOne({group: this.name, inst_id: this.instId}).exec())?.exams

    //     if(!exams) return `У меня нет расписания экзаменов для твоей группы.\n\nЕсли ты хочешь добавить расписание экзаменов для своей группы, перейди в /settings и нажми "Обновить экзамены".`;
    //     else {
    //         let F = (date: Date) => `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')} ${date.getUTCDate().toString().padStart(2, '0')}.${(date.getUTCMonth()+1).toString().padStart(2, '0')}.${date.getUTCFullYear()}`;

    //         let examsSchedule = exams.reduce((acc, x) => acc + `<b>${F(x.date!)} / ${x.name}</b>\n  Преподаватель: ${x.teacher}\n  Аудитория: ${x.auditory}\n\n`, "")

    //         return `<u><b>РАСПИСАНИЕ ЭКЗАМЕНОВ</b></u>\n\n` + (examsSchedule !== "" ? examsSchedule : "Расписание экзаменов не установлено");
    //     }
    // }

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


    async updateScheduleFromSite() {
        let F = (days: IDay[], updateDate = new Date()) => {return {updateDate, days};};

        try {
            let days = await this.parser.parseSchedule();

            await Schedules.findOneAndUpdate({ group: this.name, inst_id: this.instId }, {
                days,
                updateDate: new Date()
            }, { upsert: true });

            return F(days);
        } catch (error) {
            return null;
        }
    }

    
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