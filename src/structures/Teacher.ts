import { days, weekNumber } from '../shared/lib/Utils.js';
import BaseTeacher from '../shared/structures/Teacher.js';

export default class Teacher extends BaseTeacher {
    getTextFullSchedule(startDate: Date) {
        if (!this.schedule || this.schedule == null || this.schedule == undefined) return null;

        let week = startDate.getWeek() % 2 == 0;
        let schedule = this.schedule.days.filter((elm) => elm.even == week);
        let num = weekNumber(startDate);
        let out = `<u><b>${week ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ${num ? ` | №${num}` : ''}:</b></u>\n`;

        if (!schedule.length) return out + 'Здесь ничего нет...';

        let dict: { [index: string]: string } = {
            Лекция: 'Лек',
            Лабораторная: 'Лаб',
            Практика: 'Прак',
        };

        let date = new Date(startDate);

        schedule.forEach((day, i, arr) => {
            out +=
                `\n<b>${days[day.daynum]} | ${date.stringDate()}</b>\n` +
                day.daySchedule.reduce(
                    (acc, lesson) =>
                        acc +
                        `${lesson.number}. ${lesson.name} [${dict[lesson.paraType] ?? lesson.paraType}]\n` +
                        `  Аудитория: ${lesson.auditory}\n` +
                        `  Группа: ${lesson.group}\n\n`,
                    '',
                );

            if (arr[i + 1]) date.setUTCDate(date.getUTCDate() + (arr[i + 1].daynum - day.daynum));
        });

        return out;
    }
}
