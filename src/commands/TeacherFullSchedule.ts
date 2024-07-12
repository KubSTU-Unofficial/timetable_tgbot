import { Message, SendMessageOptions } from "node-telegram-bot-api";
import Command from "../structures/Command.js";
import User from "../structures/User.js";
import Cache from "../lib/Cache.js";
import TeacherScheduleModel from "../shared/models/TeacherScheduleModel.js";
import { weekNumber, days as daysWeek } from "../shared/lib/Utils.js";

interface ITeacherSchedule {
    days: ITeacherDay[],
    name: string, 
    updateDate: Date
}

export default class TodayCommand extends Command {
    name = {};
    sceneName = ["teachers"];

    nameFormat(name:string) {
        let nameArr = name.split(" ");

        return `${nameArr[0]} ${nameArr[1][0]}. ${nameArr[2][0]}.`;
    }

    getTextFullSchedule(week:boolean, schedule:ITeacherSchedule) {
        if(schedule == null || schedule == undefined) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        let date  = new Date();
        let num   = weekNumber(date);
        let days  = schedule.days.filter(elm => elm.even == week);
        let out   = `<u><b>${week ? "ЧЁТНАЯ" : "НЕЧЁТНАЯ"} НЕДЕЛЯ:</b></u>\n`;

        if(!days.length) return out + `На этой неделе у преподавателя нет пар...`;

        let dict:{[index: string]: string} = {
            "Лабораторная": "Лаб",
            "Практика": "Прак",
            "Лекция": "Лек"
        };
        
        // Находим понедельник
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (date.getDay() || 7) + (((date.getWeek()%2 == 0) != week) ? 7 : 0) + days[0].daynum);

        days.forEach((day, i, arr) => {
            out += `\n<b>${daysWeek[day.daynum]} | ${date.stringDate()}</b>\n`;
            
            day.daySchedule.forEach(lesson => {
                let para = `${lesson.number}. ${lesson.name} [${dict[lesson.paraType] ?? lesson.paraType}]\n` +
                `  Аудитория: ${lesson.auditory}\n` + 
                `  Группа: ${lesson.group}\n`;

                if(lesson.period) {
                    para = `${para}  Период: ${lesson.period}\n`;

                    let period = [+lesson.period.split(" ")[1], +lesson.period.split(" ")[3]];

                    if(num && (period[0] > num || period[1] < num)) {
                        para = `<i>${para}</i>`;
                    }
                }

                out += para + '\n';
            });

            if(arr[i+1]) date.setUTCDate(date.getUTCDate()+(arr[i+1].daynum - day.daynum));
        });

        return out;
    }

    async exec(user: User, msg: Message): Promise<void> {
        user.setScene("main");

        let schedule = await user.group!.getFullRawSchedule();
        let dict: { [key:string]: string } = {};

        let options: SendMessageOptions = {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: user.getMainKeyboard(),
                resize_keyboard: true,
                remove_keyboard: msg.chat.type !== "private"
            }
        };

        if(schedule) {
            schedule.forEach(lesson => {
                if(lesson.teacher && lesson.teacher !== "Не назначен" && !dict[this.nameFormat(lesson.teacher)]) dict[this.nameFormat(lesson.teacher)] = lesson.teacher;
            });
        }

        let teacherSchedule = await TeacherScheduleModel.findOne({$or: [{name: dict[msg.text!]}, {name: msg.text}]}).exec();

        if(!teacherSchedule) {
            Cache.bot.sendMessage(msg.chat.id, "Я не знаю такого учителя. Проверь всё ли верно ты написал и попробуй ещё раз", options);

            return;
        }

        let date = new Date();

        let schedule1 = this.getTextFullSchedule(date.getWeek()%2==0, teacherSchedule as ITeacherSchedule);
        let schedule2 = this.getTextFullSchedule(date.getWeek()%2==1, teacherSchedule as ITeacherSchedule);

        // TODO: Сделай уже с этим что-нибудь!
        if((schedule1 && schedule1?.length > 4096) || (schedule2 && schedule2?.length > 4096)) {
            await Cache.bot.sendMessage(msg.chat.id, `<b>Извини, у этого преподавателя слишком большое расписание</b>\n\nЯ уже работаю над этой проблемой`, options);

            return;
        }

        if(schedule1) await Cache.bot.sendMessage(msg.chat.id, schedule1, options);
        if(schedule2) await Cache.bot.sendMessage(msg.chat.id, schedule2, options);
    }
}