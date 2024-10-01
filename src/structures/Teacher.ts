import { weekNumber, days as daysWeek } from '../shared/lib/Utils.js';
import BaseTeacher from '../shared/structures/Teacher.js';

export default class Teacher extends BaseTeacher {
    getTextFullSchedule(week: boolean) {
        if (!this.schedule) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        let date = new Date();
        let num = weekNumber(date);
        let days = this.schedule.days.filter((elm) => elm.even == week);
        let out = `<u><b>${week ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ:</b></u>\n`;

        if (!days.length) return out + `На этой неделе у преподавателя нет пар...`;

        let dict: { [index: string]: string } = {
            Лабораторная: 'Лаб',
            Практика: 'Прак',
            Лекция: 'Лек',
        };

        // Находим понедельник
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (date.getDay() || 7) + ((date.getWeek() % 2 == 0) != week ? 7 : 0) + days[0].daynum);

        days.forEach((day, i, arr) => {
            out += `\n<b>${daysWeek[day.daynum]} | ${date.stringDate()}</b>\n`;

            day.daySchedule.forEach((lesson) => {
                let para =
                    `${lesson.number}. ${lesson.name} [${dict[lesson.paraType] ?? lesson.paraType}]\n` +
                    `  Аудитория: ${lesson.auditory}\n` +
                    `  Группа: ${lesson.group}\n`;

                if (lesson.period) {
                    para = `${para}  Период: ${lesson.period}\n`;

                    let period = [+lesson.period.split(' ')[1], +lesson.period.split(' ')[3]];

                    if (num && (period[0] > num || period[1] < num)) {
                        para = `<i>${para}</i>`;
                    }
                }

                out += para + '\n';
            });

            if (arr[i + 1]) date.setUTCDate(date.getUTCDate() + (arr[i + 1].daynum - day.daynum));
        });

        return out;
    }
}
