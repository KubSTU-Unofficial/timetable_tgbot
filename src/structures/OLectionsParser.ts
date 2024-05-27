import fetch from "node-fetch";
import https from "https";
import { parse, HTMLElement } from "node-html-parser";

export default class OLectionsParser {
    URL: string;
    root?: HTMLElement;
    days = ["ВОСКРЕСЕНЬЕ", "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"];

    /**
     * Парсер очных занятий
     * @param instId ID института
     * @param kurs Курс
     * @param semestr Семестр
     * @param group Полный номер группы
     */
    constructor(instId: string | number, kurs: string | number, group: string, semestr = new Date().getMonth() > 5 ? 1 : 2) { // Конструктор делает ссылку, к которой будем обращаться
        let now = new Date();
        let date = now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1);
        
        this.URL = 'https://elkaf.kubstu.ru/timetable/default/time-table-student-ofo?iskiosk=0&' + 
            `fak_id=${instId}&` + 
            `kurs=${kurs}& ` +
            `gr=${group}&` +
            `ugod=${date}&` +
            `semestr=${semestr}`;
    }

    async parseSchedule() {
        const res = await fetch(this.URL, {
            headers: {
                "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
            },
            agent: new https.Agent({ rejectUnauthorized: false })
        });

        let text = await res.text();
        this.root = parse(text);

        const out = [];

        for (let week = 1; week <= 2; week++) {
            for (let day = 1; day <= 6; day++) {
                let daySchedule = [];

                for (let i = 1; ; i++) {
                    let rawLesson = this.getLessonRaw(week, day, i);

                    if (!rawLesson) break;

                    daySchedule.push(rawLesson);
                }

                if (daySchedule.length > 0) out.push({
                    daynum: day,
                    even: week == 2,
                    daySchedule
                });
            }
        }

        return out;
    }
    
    /**
     * Возвращает объект с информацией об одной указанной паре
     */
    private getLessonRaw(week: number, day: number, num: number): ILesson | null {
        if (!this.root) return null;

        let headElement = this.root.querySelector(`#heading_n_${week}_d_${day}_i_${num}`);
        let collapseElement = this.root.querySelector(`#collapse_n_${week}_d_${day}_i_${num}`);

        if (!headElement || !collapseElement) return null;

        // Расписание разделено на голову и раскрывающуюся часть
        // Тут анализируем голову, из которой вынимаем:
        let headTextArray = headElement.text
            .trim()
            .split("/")
            .map(elm => { return elm.trim(); });

        // Номер пары
        let number = +headTextArray[0].slice(0, 1);

        // Время проведения
        let time = headTextArray[0].match(/\(.+\)/g)![0];
        time = time.substring(1, time.length - 1);

        // Название пары
        let name = headTextArray[1];

        // Тип пары
        const types = { 
            "Лекции": "Лекция",
            "Практические занятия": "Практика",
            "Лабораторные занятия": "Лабораторная"
        };

        let paraType = types[headTextArray[2] as keyof typeof types] ?? headTextArray[2];

        let out:ILesson = {
            number,
            time,
            name,
            paraType
        };

        // С раскрывающейся частью проще
        collapseElement.querySelector(".panel-body")!
            .childNodes
            .filter(element => element?.constructor?.name == "HTMLElement")
            .forEach(element => {
                if (element.text.startsWith("Преподаватель:"))
                    out.teacher = element.text.slice(15).trim() == "" ? "Не назначен" : element.text.slice(15).trim();

                else if (element.text.startsWith("Аудитория:") && element.text.slice(11).trim() !== "")
                    out.auditory = element.text.slice(11).trim();

                else if (element.text.startsWith("Примечание:") && element.text.slice(12).trim() !== "")
                    out.remark = element.text.slice(12).trim();

                if (element.text.startsWith("Процент группы:") && element.text.slice(16).trim() !== "")
                    out.percent = element.text.slice(16).trim();

                if (element.text.startsWith("В лекционном потоке: Да"))
                    out.flow = true;

                if (element.text.startsWith("Период:") && element.text !== "Период: с 1 по 18 неделю" && element.text.slice(8).trim() !== "")
                    out.period = element.text.slice(8).trim();
            });

        return out;
    }
}
