import { days, weekNumber, daysOdd, daysEven, getMonday } from '../shared/lib/Utils.js';
import BaseGroup from '../shared/structures/Group.js';
import Events from '../shared/models/EventsModel.js';
import APIConvertor, { LessonTypesShorted } from '../shared/lib/APIConvertor.js';
import BaseOGroup from '../shared/structures/OGroup.js';
import { KeyboardButton } from 'node-telegram-bot-api';
import { ILesson } from '../shared/models/LessonModel.js';

export default class OGroup extends BaseOGroup implements IUnifiedGroup {
    formatSchedule(lessons: ILesson[], date = new Date()) {
        let out = '';
        let para = '';
        let startDate = this.cachedFullRawSchedule?.lessonsStartDate; // TODO: Подозреваю, это довольно сильное упущение, но пока что будет такой костыль
        let weekNum = date && startDate ? weekNumber(startDate, date) : null;

        lessons.forEach((elm) => {
            para += `\n\n${elm.number} пара: ${elm.name} [${LessonTypesShorted[elm.type]}]\n  Время: ${BaseGroup.lessonsTime[elm.number].join(' - ')}`;
            para += `\n  Преподаватель: ${elm.teacherName ?? 'Не назначен'}`;
            para += `\n  Аудитория: ${elm.classroom ?? 'Не назначена'}`;
            if (elm.percentOfGroup && elm.percentOfGroup != 100) para += `\n  Процент группы: ${elm.percentOfGroup}%`;
            if (elm.isStream) para += '\n  В лекционном потоке';
            if ('weeks' in elm.day && (elm.day.weeks.from != 1 || elm.day.weeks.to != 18)) para += `\n  Период: c ${elm.day.weeks.from} по ${elm.day.weeks.to} неделю`;
            if (elm.comment) para += `\n  Примечание: ${elm.comment}`;

            if ('weeks' in elm.day && weekNum && (elm.day.weeks.from > weekNum || elm.day.weeks.to < weekNum)) para = `<i>${para}</i>`;

            out += para;
            para = '';
        });

        return out;
    }

    async getTextSchedule(date = new Date(), opts: { showDate?: boolean } = {}) {
        let day = date.getDay();
        let week = date.getWeek() % 2 == 0;
        let lessons = await this.getDayRawSchedule(day, week);

        if (!lessons)
            return '<b>Во время получения расписания произошла ошибка!</b>\n<i>Возможно стоит обратиться в <a href="https://t.me/Elektroplayer">поддержку</a></i>';

        let text = this.formatSchedule(lessons, date);

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя` +
            (opts.showDate ? ` / ${date.stringDate()}` : '') +
            `</b>` +
            (!text ? '\nПар нет! Передохни:з' : text)
        );
    }

    async getTextNextSchedule() {
        let fullRawSchedule = await this.getFullRawSchedule();

        if (!fullRawSchedule || !fullRawSchedule.length) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let date = new Date(Date.now() + 1000 * 60 * 60 * 24),
            day: number = 0,
            week: boolean = true,
            schedule: ILesson[] = [],
            eventsText: string | null = null;

        for (let i = 0; i <= 14; i++) {
            day = date.getDay();
            week = date.getWeek() % 2 == 0;

            schedule = fullRawSchedule.filter((p) => 'nedType' in p.day && p.day.nedType == week && p.day.dayOfWeek == day);
            eventsText = await this.getTextEvents(date);

            if (schedule.length || eventsText) break;
            else date.setDate(date.getDate() + 1);
        }

        if (!schedule.length && !eventsText) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let textSchedule = this.formatSchedule(schedule, date);

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя / ${date.stringDate()}</b>` +
            (!textSchedule ? '\nПар нет! Передохни:з' : textSchedule) +
            (eventsText ? `\n\n${eventsText}` : '')
        );
    }

    async getTextHalfFullSchedule(startDate: Date) {
        let schedule = await this.getFullRawSchedule();

        if (!schedule) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        let week = startDate.getWeek() % 2 == 0;
        let lessonsStartDate = this.cachedFullRawSchedule?.lessonsStartDate;
        let num = lessonsStartDate ? weekNumber(lessonsStartDate, startDate) : null;

        num = num && num <= 0 ? null : num;

        let out = `<u><b>${week ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ${num ? ` | №${num}` : ''}:</b></u>\n`;
        let dict = [undefined, 'Лек', 'Прак', 'Лаб'];
        let currWeekLessons = schedule.filter((elm) => 'nedType' in elm.day && elm.day.nedType == week);

        if (!currWeekLessons.length) return out + 'Здесь ничего нет...';

        for (let i = 1; i <= 7; i++) {
            let curDayLessons = currWeekLessons.filter((p) => 'nedType' in p.day && p.day.dayOfWeek == i);

            if (curDayLessons.length)
                out +=
                    `\n<b>${days[i]} | ${startDate.stringDate()}, ${BaseGroup.lessonsTime[curDayLessons[0].number][0]} - ${BaseGroup.lessonsTime[curDayLessons[curDayLessons.length - 1].number][1]}</b>\n` +
                    curDayLessons.reduce(
                        (acc, lesson) =>
                            acc +
                            `  ${lesson.number}. ${lesson.name} [${dict[lesson.type]}] ${lesson.classroom ? `(${lesson.classroom})` : ''} \n`,
                        '',
                    );

            startDate.setDate(startDate.getDate() + 1);
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
        let date = new Date();
        let ugod = date.getFullYear() - (date.getMonth() >= 6 ? 0 : 1);
        let sem = date.getMonth() > 5 ? 1 : 2;

        if (!this.cachedFullRawSchedule) await this.getFullRawSchedule();
        if (sem == 2 && this.cachedFullRawSchedule?.lessonsStartDate && this.cachedFullRawSchedule.lessonsStartDate > new Date()) sem = 1;

        // TODO: Вынести в отдельный метод с получением из БД
        let resp = await APIConvertor.exam(this.name, ugod, sem);

        if (!resp || !resp.isok) return undefined;
        if (!resp.data.length) return `У меня нет расписания экзаменов для твоей группы...`;

        let examsText = resp.data.reduce(
            (acc, x) =>
                acc +
                `<b>${x.time_sd.substring(0, x.time_sd.length - 3)} ${x.date_sd} / ${x.disc.disc_name}</b>\n  Преподаватель: ${x.teacher}\n  Аудитория: ${x.classroom}\n\n`,
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
