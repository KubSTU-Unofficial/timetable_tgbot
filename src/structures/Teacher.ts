import { days, getMonday } from '../shared/lib/Utils.js';
import BaseTeacher from '../shared/structures/Teacher.js';
import { ILessonSchema } from '../shared/models/LessonModel.js';
import { format, isSameDay, addDays } from 'date-fns';

export default class Teacher extends BaseTeacher {
    getWeekDates(startDate: Date): Date[] {
        const result: Date[] = [];
        for (let i = 0; i < 7; i++) {
            result.push(addDays(startDate, i));
        }
        return result;
    }

    getDayTextSchedule(schedule: ILessonSchema[], date: Date): string | undefined {
        const dict = [undefined, 'Лек', 'Прак', 'Лаб'];

        const dayOfWeek = date.getDay();
        const nedType = date.getWeek() % 2 == 0;

        const lessonsInCurDay = schedule
            .filter((s) => {
                const isOFO = s.timing.weeks && s.timing.weeks.type === nedType && s.timing.weeks.dayOfWeek === dayOfWeek;
                const isZFO = s.timing.date && isSameDay(s.timing.date, date);
                return isOFO || isZFO;
            })
            .sort((a, b) => a.timing.lessonNumber - b.timing.lessonNumber);

        if (!lessonsInCurDay.length) return;

        return `<b>${days[dayOfWeek]} | ${format(date, 'd.M.yyyy')}</b>\n` + lessonsInCurDay.reduce(
            (acc, lesson) => {
                let out = `${lesson.timing.lessonNumber}. ${lesson.name} [${dict[lesson.type]}]\n` +
                    `  Аудитория: ${lesson.classroom}\n` +
                    `  Группа: ${lesson.group}\n`;

                if (
                    lesson.timing.weeks?.startDate &&
                    !(lesson.timing.weeks.startDate <= date && date < lesson.timing.weeks.endDate!)
                ) {
                    out = `<i>${out}  Период: c ${lesson.timing.weeks.from} по ${lesson.timing.weeks.to} неделю</i>\n`;
                }

                return acc + out + '\n';
            }, '',
        );
    }

    async getTextFullSchedule() {
        const schedule = await this.getFullRawSchedule();

        if (!schedule || !schedule.length) {
            return [`Здесь ничего нет... <i>Возможно ты ошибся с именем преподавателя</i>`];
        }

        const now = new Date();
        const curMonday = getMonday(now);
        const nextMonday = addDays(curMonday, 7);
        
        let out: string[] = [];
        let currentMessage = '';

        const processWeek = (startDate: Date, weekName: string) => {
            currentMessage += `<u><b>${weekName} НЕДЕЛЯ:</b></u>\n`;
            let hasLessons = false;

            for (const date of this.getWeekDates(startDate)) {
                const text = this.getDayTextSchedule(schedule, date);
                if (!text) continue;

                hasLessons = true;
                if ((currentMessage + `\n${text}`).length > 4096) {
                    out.push(currentMessage);
                    currentMessage = text;
                } else {
                    currentMessage += `\n${text}`;
                }
            }

            if (!hasLessons) {
                currentMessage += `Здесь ничего нет...`;
            }
        };

        processWeek(curMonday, curMonday.getWeek() % 2 === 0 ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ');
        out.push(currentMessage);
        currentMessage = '';
        processWeek(nextMonday, nextMonday.getWeek() % 2 === 0 ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ');
        out.push(currentMessage);

        return out.filter(m => m.trim() !== '');
    }

    static fromArray(arr: string[]): Teacher {
        if (arr.length === 1) return new Teacher(arr[0]);
        return new Teacher(arr.reduce((a, b) => (b.length > a.length ? b : a), ''));
    }
}
