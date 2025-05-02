import { days } from '../shared/lib/Utils.js';
import BaseGroup from '../shared/structures/Group.js';
import Events from '../shared/models/EventsModel.js';
import APIConvertor, { LessonTypesShorted } from '../shared/lib/APIConvertor.js';
import BaseZGroup from '../shared/structures/ZGroup.js';
import { KeyboardButton } from 'node-telegram-bot-api';
import { ILesson } from '../shared/models/LessonModel.js';

export default class ZGroup extends BaseZGroup implements IUnifiedGroup {
    formatSchedule(lessons: ILesson[]) {
        let out = '';
        let para = '';

        lessons.forEach((elm) => {
            para += `\n\n${elm.number} пара: ${elm.name} [${LessonTypesShorted[elm.type]}]\n  Время: ${BaseGroup.lessonsTime[elm.number].join(' - ')}`
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
        let lessons = await this.getDayRawSchedule(date);

        if (!lessons)
            return '<b>Во время получения расписания произошла ошибка!</b>\n<i>Возможно стоит обратиться в <a href="https://t.me/Elektroplayer">поддержку</a></i>';

        let text = this.formatSchedule(lessons);

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

        let sortedSchedule = fullRawSchedule
            .flatMap((p) => {
                if('datez' in p.day) {
                    return [{...p, day: {datez: p.day.datez, date: new Date(p.day.datez)}}];
                }
                else return [];
            })
            .sort((a, b) => a.day.date.getTime() - b.day.date.getTime());
        let closestDate: Date | undefined;
        let now = new Date();

        for (let pair of sortedSchedule) {
            if (pair.day.date > now) {
                closestDate = pair.day.date;
                break;
            }
        }

        if (!closestDate) return '<b>Ближайшего расписания не найдено...</b> <i>или что-то пошло не так...</i>';

        let schedule: ILesson[] = sortedSchedule.filter((pair) => pair.day.date == closestDate);
        let eventsText = await this.getTextEvents(closestDate);
        let textSchedule = this.formatSchedule(schedule);

        let day: number = closestDate.getDay();
        let week: boolean = closestDate.getWeek() % 2 == 0;

        return (
            `<b>${days[day]} / ${week ? 'Чётная' : 'Нечётная'} неделя / ${closestDate.stringDate()}</b>` +
            (!textSchedule ? '\nПар нет! Передохни:з' : textSchedule) +
            (eventsText ? `\n\n${eventsText}` : '')
        );
    }

    async getTextFullSchedule() {
        let schedule = await this.getFullRawSchedule();

        if (!schedule) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        let out = [`<u><b>ПОЛНОЕ РАСПИСАНИЕ:</b></u>\n\n`];
        let daysText: string[] = [];
        let dict = [undefined, 'Лек', 'Прак', 'Лаб'];

        if (!schedule.length) return [`<u><b>ПОЛНОЕ РАСПИСАНИЕ:</b></u>\nЗдесь ничего нет...`];

        let grouped = schedule.reduce(
            (acc, item) => {
                if('datez' in item.day) {
                    if (!acc[item.day.datez]) acc[item.day.datez] = [];
                    acc[item.day.datez].push(item);
                }
                return acc;
            },
            {} as Record<string, (typeof schedule)[number][]>,
        );

        for (let day in grouped) {
            daysText.push(
                `<b>${days[new Date(day).getDay()]} | ${day}, ${BaseGroup.lessonsTime[grouped[day][0].number][0]} - ${BaseGroup.lessonsTime[grouped[day][grouped[day].length - 1].number][1]}</b>\n` +
                    grouped[day].reduce(
                        (acc, lesson) =>
                            acc +
                            `  ${lesson.number}. ${lesson.name} [${dict[lesson.type]}] (${lesson.classroom})\n`,
                        '',
                    ),
            );
        }

        for (let i = 0, l = 0; i < daysText.length; i++) {
            if ((out[l] + daysText[i] + '\n').length > 4096) out[++l] = daysText[i] + '\n';
            else out[l] += daysText[i] + '\n';
        }

        console.log(out);

        return out;
    }

    async getTextExams() {
        let date = new Date();
        let ugod = date.getFullYear() - (date.getMonth() >= 6 ? 0 : 1);
        let sem = date.getMonth() > 5 ? 1 : 2;

        if (!this.cachedFullRawSchedule) await this.getFullRawSchedule();
        // TODO: Добавить проверку по первой паре (возможно через BaseZGroup).
        // В идеале смотреть на дату последнего занятия в первом семестре и дату начала первого занятия во втором семестре.
        // if (sem == 2 && this.cachedFullRawSchedule?.lessonsStartDate && this.cachedFullRawSchedule.lessonsStartDate > new Date()) sem = 1;

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
        let schedule = this.cachedFullRawSchedule?.data;

        if (!schedule) return [];
        let dateMap = new Map<string, { text: string }>();

        for (const s of schedule) {
            if ('datez' in s.day && !dateMap.has(s.day.datez)) dateMap.set(s.day.datez, { text: s.day.datez });
        }

        let dates = Array.from(dateMap.values());
        let out: KeyboardButton[][] = [];

        for (let i = 0; i < dates.length; i += 3) {
            out.push(dates.slice(i, i + 3));
        }

        return out;
    }
}
