import { days, weekNumber } from '../shared/lib/Utils.js';
import BaseGroup from '../shared/structures/Group.js';
import Events from '../shared/models/EventsModel.js';
import APIConvertor, { IRespOFOPara } from '../shared/lib/APIConvertor.js';

export default class Group extends BaseGroup {
    formatSchedule(lessons: IRespOFOPara[], date = new Date()) {
        let out = '';
        let para = '';
        let weekNum = date ? weekNumber(date) : null;

        lessons.forEach((elm) => {
            para += `\n\n${elm.pair} пара: ${elm.disc.disc_name} [${BaseGroup.lessonsTypes[elm.kindofnagr.kindofnagr_name]}]\n  Время: ${BaseGroup.lessonsTime[elm.pair]}`;
            if (elm.teacher) para += `\n  Преподаватель: ${elm.teacher}`;
            if (elm.classroom) para += `\n  Аудитория: ${elm.classroom}`;
            if (elm.persent_of_gr != 100) para += `\n  Процент группы: ${elm.persent_of_gr}%`;
            if (elm.ispotok) para += '\n  В лекционном потоке';
            if (elm.ned_from != 1 || elm.ned_to != 18) para += `\n  Период: c ${elm.ned_from} по ${elm.ned_to} неделю`;
            if (elm.comment) para += `\n  Примечание: ${elm.comment}`;

            if (weekNum && (elm.ned_from > weekNum || elm.ned_to < weekNum)) para = `<i>${para}</i>`;

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

    async getTextFullSchedule(week: boolean, startDate: Date) {
        let schedule = await this.getFullRawSchedule();
        let num = weekNumber(startDate);
        let out = '';

        let dict: { [index: string]: string } = {
            Лекции: 'Лек',
            'Практические занятия': 'Прак',
            'Лабораторные занятия': 'Лаб',
        };

        if (schedule == null || schedule == undefined) return null; // "<b>Произошла ошибка<b>\nСкорее всего сайт с расписанием не работает...";

        out += `<u><b>${week ? 'ЧЁТНАЯ' : 'НЕЧЁТНАЯ'} НЕДЕЛЯ${num ? ` | №${num}` : ''}:</b></u>\n`;

        if (!schedule.length) return out + 'Здесь ничего нет...';

        let currWeekLessons: IRespOFOPara[] = schedule.filter((elm) => elm.nedtype.nedtype_id == (week ? 2 : 1));

        for (let i = 1; i <= 7; i++) {
            let curDayLessons = currWeekLessons.filter((p) => p.dayofweek.dayofweek_id == i);

            if (curDayLessons.length) {
                out += `\n<b>${days[i]} | ${startDate.stringDate()}, ${BaseGroup.lessonsTime[curDayLessons[0].pair].split(' - ')[0]} - ${BaseGroup.lessonsTime[curDayLessons[curDayLessons.length - 1].pair].split(' - ')[1]}</b>\n`;

                curDayLessons.forEach((lesson) => {
                    out += `  ${lesson.pair}. ${lesson.disc.disc_name} [${dict[lesson.kindofnagr.kindofnagr_name] ?? lesson.kindofnagr.kindofnagr_name}] (${lesson.classroom})\n`;
                });
            }

            startDate.setDate(startDate.getDate() + 1);
        }

        return out;
    }

    async getTextExams() {
        let date = new Date();
        let ugod = date.getFullYear() - (date.getMonth() >= 6 ? 0 : 1);
        let sem = date.getMonth() > 5 ? 1 : 2;

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
}
