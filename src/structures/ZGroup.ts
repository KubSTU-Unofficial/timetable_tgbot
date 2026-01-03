import { days } from '../shared/lib/Utils.js';
import BaseGroup from '../shared/structures/Group.js';
import Events from '../shared/models/EventsModel.js';
import APIConvertor, { LessonTypesShorted } from '../shared/lib/APIConvertor.js';
import BaseZGroup from '../shared/structures/ZGroup.js';
import { KeyboardButton } from 'node-telegram-bot-api';
import { ILessonSchema } from '../shared/models/LessonModel.js';
import { format, parse } from 'date-fns';

export default class ZGroup extends BaseZGroup implements IUnifiedGroup {
    formatSchedule(lessons: ILessonSchema[]) {
        let out = '';
        let para = '';

        lessons.forEach((elm) => {
            para += `\n\n${elm.timing.lessonNumber} пара: ${elm.name} [${LessonTypesShorted[elm.type]}]`
                + `  \n  Время: ${BaseGroup.lessonsTime[elm.timing.lessonNumber].join(' - ')}`
                + `\n  Преподаватель: ${elm.teacherName ?? 'Не назначен'}`
                + `\n  Аудитория: ${elm.classroom ?? 'Не назначена'}`;

            if (elm.comment) para += `\n  Примечание: ${elm.comment}`;

            out += para;
            para = '';
        });

        return out;
    }

    async getTextSchedule(date = new Date(), opts: { showDate?: boolean } = {}) {
        let day = date.getDay();
        let week = date.getWeek() % 2 == 0;
        let lessons = await this.getTimetable({ date });

        if (!lessons)
            return '<b>Во время получения расписания произошла ошибка!</b>\n<i>Возможно стоит обратиться в <a href="https://t.me/Elektroplayer">поддержку</a></i>';

        let text = this.formatSchedule(lessons);

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя` +
            (opts.showDate ? ` / ${format(date, 'd.M.yyyy')}` : '') +
            `</b>` +
            (!text ? '\nПар нет! Передохни:з' : text)
        );
    }

    async getTextNextSchedule() {
        let fullRawSchedule = await this.getTimetable();

        if (!fullRawSchedule || !fullRawSchedule.length) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let sortedSchedule = fullRawSchedule.sort((a, b) => a.timing.date!.getTime() - b.timing.date!.getTime());
        let closestDate: Date | undefined;
        let now = new Date();

        for (let pair of sortedSchedule) {
            if (pair.timing.date && pair.timing.date > now) {
                closestDate = pair.timing.date;
                break;
            }
        }

        if (!closestDate) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let schedule: ILessonSchema[] = sortedSchedule.filter((pair) => pair.timing.date!.valueOf() == closestDate.valueOf());
        let eventsText = await this.getTextEvents(closestDate);
        let textSchedule = this.formatSchedule(schedule);

        let day: number = closestDate.getDay();
        let week: boolean = closestDate.getWeek() % 2 == 0;

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя / ${format(closestDate, 'd.M.yyyy')}</b>` +
            (!textSchedule ? '\nПар нет! Передохни:з' : textSchedule) +
            (eventsText ? `\n\n${eventsText}` : '')
        );
    }

    async getTextFullSchedule() {
        const schedule = await this.getTimetable();
        if (!schedule) return null;

        if (!schedule.length) return [`<u><b>ПОЛНОЕ РАСПИСАНИЕ:</b></u>\nЗдесь ничего нет...`];

        const out = [`<u><b>ПОЛНОЕ РАСПИСАНИЕ:</b></u>\n\n`];
        const dict = [undefined, 'Лек', 'Прак', 'Лаб'];

        const grouped = schedule.reduce((acc, item) => {
            if (item.timing.date) {
                const dateKey = format(item.timing.date, 'dd.MM.yyyy');
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(item);
            }
            return acc;
        }, {} as Record<string, ILessonSchema[]>);

        const daysText: string[] = [];
        for (const dayKey in grouped) {
            const lessonsForDay = grouped[dayKey];
            const dateObject = parse(dayKey, 'dd.MM.yyyy', new Date());

            daysText.push(
                `<b>${days[dateObject.getDay()]} | ${dayKey}, ${BaseGroup.lessonsTime[lessonsForDay[0].timing.lessonNumber][0]} - ${BaseGroup.lessonsTime[lessonsForDay[lessonsForDay.length - 1].timing.lessonNumber][1]}</b>\n` +
                lessonsForDay.reduce(
                    (acc, lesson) =>
                        acc +
                        `  ${lesson.timing.lessonNumber}. ${lesson.name} [${dict[lesson.type]}] (${lesson.classroom})\n`,
                    '',
                ),
            );
        }

        for (let i = 0, l = 0; i < daysText.length; i++) {
            if ((out[l] + daysText[i] + '\n').length > 4096) {
                l++;
                out[l] = '';
            }
            out[l] += daysText[i] + '\n';
        }

        return out;
    }

    async getTextExams() {
        // let date = new Date();
        let groupInfo = await this.getAndStoreGroupInfo();
        let ugod = groupInfo.year;
        let sem = groupInfo.sem;

        // TODO: Вынести в отдельный метод с получением из БД
        let resp = await APIConvertor.exam(this.name, ugod, sem);

        if (!resp || !resp.isok) return undefined;
        if (!resp.data.length) return `У меня нет расписания экзаменов для твоей группы...`;

        let examsText = resp.data.reduce(
            (acc, x) =>
                acc +
                `<b>${format(x.date, "dd.MM.yyyy, H:mm")} / ${x.name}</b>\n  Преподаватель: ${x.teacher}\n  Аудитория: ${x.classroom}\n\n`,
            '',
        );

        return `<u><b>РАСПИСАНИЕ ЭКЗАМЕНОВ</b></u>\n\n${examsText}`;
    }

    async getTextEvents(refDate = new Date()): Promise<string | null> {
        let date = new Date(refDate);
        date.setUTCHours(0, 0, 0, 0); // TODO: А тут точно нужно именно UTC?

        let filter = {
            $or: [
                { date: date },
                { startDate: { $lte: date }, endDate: { $gte: date } },
            ],
            $and: [
                { $or: [{ groups: undefined }, { groups: this.name }] },
                { $or: [{ kurses: undefined }, { kurses: this.kurs }] },
                { $or: [{ inst_ids: undefined }, { inst_ids: this.instId }] },
            ],
        };

        let dayEvents = await Events.find(filter);
        let out = dayEvents.reduce(
            (acc, elm, i) => acc + `\n\n${i + 1}. <b>${elm.name}</b>` + (elm.note ? `\n  ${elm.note.replace('\n', '\n  ')}` : ''),
            '',
        );

        return out ? '<b>СОБЫТИЯ:</b>' + out : null;
    }

    selectDayKeyboard(): KeyboardButton[][] {
        if (!this.cache.timetable) return [];

        const datesTS = this.cache.timetable.map((l) => l.timing.date!.getTime());
        const buttons = Array.from(new Set(datesTS))
            .sort((a, b) => a - b)
            .map((ts) => ({ text: format(new Date(ts), "dd.MM.yyyy") }));

        let out: KeyboardButton[][] = [];

        for (let i = 0; i < buttons.length; i += 3) {
            out.push(buttons.slice(i, i + 3));
        }

        return out;
    }
}
