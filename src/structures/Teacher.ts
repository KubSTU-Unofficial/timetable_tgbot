import { days, getMonday } from '../shared/lib/Utils.js';
import BaseTeacher from '../shared/structures/Teacher.js';
import { ILessonSchema } from '../shared/models/LessonModel.js';

export default class Teacher extends BaseTeacher {
    getWeekDates(startDate: Date): Date[] {
        const result: Date[] = [];

        for(let i = 0; i < 7; i++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + i);
            result.push(current);
        }

        return result;
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    getDayTextSchedule(schedule: ILessonSchema[], date: Date): string | undefined {
        let dict = [undefined, 'Лек', 'Прак', 'Лаб'];

        let dayOfWeek = date.getDay();
        let nedType = date.getWeek() % 2 == 0;
        let datez = this.formatDate(date);

        let lessonsInCurDay = schedule
        .filter((s) => ('dayOfWeek' in s.day && s.day.nedType == nedType && s.day.dayOfWeek == dayOfWeek) || ('datez' in s.day && s.day.datez == datez))
        .sort((a, b) => a.number - b.number);

        if(!lessonsInCurDay.length) return;

        return `<b>${days[dayOfWeek]} | ${date.stringDate()}</b>\n` + lessonsInCurDay.reduce(
            (acc, lesson) => {
                let out = `${lesson.number}. ${lesson.name} [${dict[lesson.type]}]\n` +
                    `  Аудитория: ${lesson.classroom}\n` +
                    `  Группа: ${lesson.group}\n`;

                if(
                    'nedType' in lesson.day && lesson.day.weeks.startDate &&
                    !(lesson.day.weeks.startDate <= date && date.valueOf() < lesson.day.weeks.startDate.valueOf() + 1000 * 60 * 60 * 24 * 7 * (lesson.day.weeks.to - lesson.day.weeks.from))
                ) out = `<i>${out}  Период: c ${lesson.day.weeks.from} по ${lesson.day.weeks.to} неделю</i>\n`;

                return acc + out + '\n';
            },
            '',
        );
    }

    async getTextFullSchedule() {
        let schedule = await this.getFullRawSchedule();

        if(!schedule) return;
        if(!schedule.length) return [`Здесь ничего нет... <i>Возможно ты ошибся с именем преподавателя</i>`];

        let now = new Date();
        let curMonday = getMonday(now);
        let nextMonday = new Date(curMonday.valueOf() + 1000 * 60 * 60 * 24 * 7); // Накидываем неделю
        let out = [`<u><b>${curMonday.getWeek() % 2 == 0 ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ:</b></u>\n`];

        for(let date of this.getWeekDates(curMonday)) {
            let text = this.getDayTextSchedule(schedule, date);

            if(!text) continue;

            if((out[out.length - 1] + `\n${text}`).length > 4096) out.push(text);
            else out[out.length - 1] += `\n${text}`;
        }

        if(out[out.length - 1] == `<u><b>${curMonday.getWeek() % 2 == 0 ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ:</b></u>\n`)
            out[out.length - 1] += `Здесь ничего нет...`;

        out.push(`<u><b>${curMonday.getWeek() % 2 == 1 ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ:</b></u>\n`);

        for(let date of this.getWeekDates(nextMonday)) {
            let text = this.getDayTextSchedule(schedule, date);

            if(!text) continue;

            if((out[out.length - 1] + `\n${text}`).length > 4096) out.push(text);
            else out[out.length - 1] += `\n${text}`;
        }

        if(out[out.length - 1] == `<u><b>${curMonday.getWeek() % 2 == 1 ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ:</b></u>\n`)
            out[out.length - 1] += `Здесь ничего нет...`;

        return out;
    }

    static fromArray(arr: string[]) {
        if(arr.length == 1) return new Teacher(arr[0]);
        return new Teacher(arr.reduce((a, b) => (b.length > a.length ? b : a), ''));
    }
}
