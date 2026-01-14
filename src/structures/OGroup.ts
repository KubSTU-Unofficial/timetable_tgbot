import { days, weekNumber, daysOdd, daysEven, getMonday } from '../shared/lib/Utils.js';
import Group from '../shared/structures/Group.js';
import Events from '../shared/models/EventsModel.js';
import APIConvertor, { LessonTypesShorted } from '../shared/lib/APIConvertor.js';
import BaseOGroup from '../shared/structures/OGroup.js';
import { KeyboardButton } from 'node-telegram-bot-api';
import { ILessonSchema } from '../shared/models/LessonModel.js';
import { format } from 'date-fns';

export default class OGroup extends BaseOGroup implements IUnifiedGroup {
    formatSchedule(lessons: ILessonSchema[], date = new Date(), lessonsPeriod?: Date[] | undefined) {
        let out = '';
        let para = '';
        let weekNum = date && lessonsPeriod ? weekNumber(lessonsPeriod[0], date) : null;

        lessons.forEach((elm) => {
            para += `\n\n${elm.timing.lessonNumber} пара: ${elm.name} [${LessonTypesShorted[elm.type]}]` +
                `\n  Время: ${Group.lessonsTime[elm.timing.lessonNumber].join(' - ')}` +
                `\n  Преподаватель: ${elm.teacherName ?? 'Не назначен'}` +
                `\n  Аудитория: ${elm.classroom ?? 'Не назначена'}`;

            if (elm.percentOfGroup && elm.percentOfGroup != 100) para += `\n  Процент группы: ${elm.percentOfGroup}%`;
            if (elm.timing.weeks) para += `\n  Период: c ${elm.timing.weeks.from} по ${elm.timing.weeks.to} неделю`;
            if (elm.isStream) para += '\n  В лекционном потоке';
            if (elm.comment) para += `\n  Примечание: ${elm.comment
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}`;

            if (weekNum && elm.timing.weeks && (elm.timing.weeks.from > weekNum || elm.timing.weeks.to < weekNum)) para = `<i>${para}</i>`;

            out += para;
            para = '';
        });

        return out;
    }

    async getTextSchedule(date = new Date(), opts: { showDate?: boolean } = {}) {
        let day = date.getDay();
        let week = date.getWeek() % 2 == 0;
        let groupInfo = await this.getAndStoreGroupInfo();
        let lessons = await this.getTimetable({ date });

        if (!lessons)
            return '<b>Во время получения расписания произошла ошибка!</b>\n<i>Возможно стоит обратиться в <a href="https://t.me/Elektroplayer">поддержку</a></i>';

        let text = this.formatSchedule(lessons, date, groupInfo?.lessonsPeriod);

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя` +
            (opts.showDate ? ` / ${format(date, 'd.M.yyyy')}` : '') +
            `</b>` +
            (!text ? '\nПар нет! Передохни:з' : text)
        );
    }

    async getTextNextSchedule() {
        let groupInfo = await this.getAndStoreGroupInfo();
        let fullRawSchedule = await this.getTimetable();

        if (!fullRawSchedule || !fullRawSchedule.length) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let date = new Date(Date.now() + 1000 * 60 * 60 * 24),
            day: number = 0,
            week: boolean = true,
            schedule: ILessonSchema[] = [],
            eventsText: string | null = null;

        for (let i = 0; i <= 14; i++) {
            day = date.getDay();
            week = date.getWeek() % 2 == 0;

            schedule = fullRawSchedule.filter((p) => p.timing.weeks && p.timing.weeks.type == week && p.timing.weeks.dayOfWeek == day);
            eventsText = await this.getTextEvents(date);

            if (schedule.length || eventsText) break;
            else date.setDate(date.getDate() + 1);
        }

        if (!schedule.length && !eventsText) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let textSchedule = this.formatSchedule(schedule, date, groupInfo?.lessonsPeriod);

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя / ${format(date, 'd.M.yyyy')}</b>` +
            (!textSchedule ? '\nПар нет! Передохни:з' : textSchedule) +
            (eventsText ? `\n\n${eventsText}` : '')
        );
    }

    async getTextHalfFullSchedule(startDate: Date) {
        let schedule = await this.getTimetable();
        if (!schedule) return null;

        let currentDate = new Date(startDate);
        let week = currentDate.getWeek() % 2 == 0;
        let num = this.cache.lessonsPeriod ? weekNumber(this.cache.lessonsPeriod[0], currentDate) : null;

        num = num && num <= 0 ? null : num;

        let out = `<u><b>${week ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ${num ? ` | №${num}` : ''}:</b></u>\n`;
        let dict = [undefined, 'Лек', 'Прак', 'Лаб'];
        let currWeekLessons = schedule.filter((elm) => elm.timing.weeks && elm.timing.weeks.type == week);

        if (!currWeekLessons.length) return out + 'Здесь ничего нет...';

        for (let i = 1; i <= 7; i++) {
            let curDayLessons = currWeekLessons.filter((p) => p.timing.weeks && p.timing.weeks.dayOfWeek == i);

            if (curDayLessons.length)
                out +=
                    `\n<b>${days[i]} | ${format(currentDate, 'd.M.yyyy')}, ${Group.lessonsTime[curDayLessons[0].timing.lessonNumber][0]} - ${Group.lessonsTime[curDayLessons[curDayLessons.length - 1].timing.lessonNumber][1]}</b>\n` +
                    curDayLessons.reduce(
                        (acc, lesson) =>
                            acc +
                            `  ${lesson.timing.lessonNumber}. ${lesson.name} [${dict[lesson.type]}] ${lesson.classroom ? `(${lesson.classroom})` : ''} \n`,
                        '',
                    );

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return out;
    }

    async getTextFullSchedule(curMonday: Date) {
        // TODO: В будущем нужно всё это сделать одной фукнцией.

        let nextMonday = new Date(curMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        let out = [await this.getTextHalfFullSchedule(curMonday), await this.getTextHalfFullSchedule(nextMonday)];

        if (out.some((s) => s == null)) return [];

        return out as string[];
    }

    async getTextExams() {
        // TODO: Вынести в отдельный метод с получением из БД
        let groupInfo = await this.getAndStoreGroupInfo();
        let year = groupInfo.year;
        let sem = groupInfo.sem;
        let resp = await APIConvertor.exam(this.name, year, sem);

        if (!resp?.isok) return undefined;
        if (!resp.data.length) return `У меня нет расписания экзаменов для твоей группы...`;

        let examsText = resp.data.reduce(
            (acc, x) =>
                acc +
                `<b>${format(x.date, "dd.MM.yyyy, H:mm")} / ${x.name}</b>\n  Преподаватель: ${x.teacher}\n  Аудитория: ${x.classroom}\n\n`,
            '',
        );

        return `<u><b>РАСПИСАНИЕ ЭКЗАМЕНОВ</b></u>\n\n${examsText}`;
    }

    async getTextEvents(date = new Date()): Promise<string | null> {
        date.setUTCHours(0, 0, 0, 0);

        // События ищутся так, чтобы они или совпадали по дате или были между начальной конечной датой,
        // при этом если у события есть список групп, курсов или институтов, для которых предназначается событие,
        // то группе, под эти критерии не подходящей, событие показываться не будет.
        let filter = {
            $or: [
                {
                    date: date,
                },
                {
                    startDate: { $lte: date },
                    endDate: { $gte: date },
                },
            ],
            $and: [
                {
                    $or: [{ groups: undefined }, { groups: this.name }],
                },
                {
                    $or: [{ kurses: undefined }, { kurses: this.kurs }],
                },
                {
                    $or: [{ inst_ids: undefined }, { inst_ids: this.instId }],
                },
            ],
        };

        let dayEvents = await Events.find(filter);
        let out = dayEvents.reduce(
            (acc, elm, i) => acc + `\n\n${i + 1}. <b>${elm.name}</b>` + (elm.note ? `\n  ${elm.note.replace('\n', '\n  ')}` : ''),
            '',
        );

        return out ? '<b>СОБЫТИЯ:</b>' + out : null;
    }

    selectDayKeyboard(date: Date = new Date()): KeyboardButton[][] {
        let out: KeyboardButton[][] = [daysOdd.slice().map((elm) => ({ text: elm })), daysEven.slice().map((elm) => ({ text: elm }))];

        if (getMonday(date).getWeek() % 2 == 0) out.reverse();

        return out;
    }
}
