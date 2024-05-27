import https from "https";
import fetch from "node-fetch";

// Нужно для самих кнопок и чтобы они нажимались
export const daysOdd = [
    "Нечёт Пн",
    "Нечёт Вт",
    "Нечёт Ср",
    "Нечёт Чт",
    "Нечёт Пт",
    "Нечёт Сб",
];

export const daysEven = [
    "Чёт Пн",
    "Чёт Вт",
    "Чёт Ср",
    "Чёт Чт",
    "Чёт Пт",
    "Чёт Сб",
];

export const insts = [
    // ИНГЭ
    495,
    // ИКСиИБ
    516,
    // ИПиПП
    490,
    // ИЭУБ
    29,
    // ИСТИ
    538,
    // ИМРИТТС
    539,
    // ИФН
    540,
    // ИТК
    541
];

export function weekNumber(date: Date = new Date()) {
    // Устанавливаем дату в понедельник
    let mondayDate = new Date(date);
    mondayDate.setHours(0, 0, 0, 0);
    mondayDate.setDate(date.getDate() - (date.getDay() || 7) + 1);

    let startDate = new Date(date);

    startDate.setHours(0, 0, 0, 0);

    if(date.getMonth() > 7) startDate.setMonth(8, 2); // Ставим 2 сентября. Первое праздник
    else startDate.setMonth(1, 5); // FIXME: НЕ ТОЧНО! Ставим 5 февраля.
    
    // Находим дату понедельника текущей недели
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);

    // Находим разницу между данной датой и датой первого дня недели в мс.
    let diff = mondayDate.valueOf() - startDate.valueOf();
        
    // Переводим в недели, округляем в большую сторону и выводим.
    return Math.round(diff / (1000*60*60*24*7)) + 1;
}

export function commandName(opts: CommandName) {
    let arr = [];

    if(opts.buttons) {
        if(Array.isArray(opts.buttons)) {
            opts.buttons.forEach(elm => {
                if(typeof elm == "string") arr.push(elm);
                else {
                    arr.push(elm.title);
                    if(elm.emoji) arr.push(`${elm.emoji} ${elm.title}`);
                }
            });
        } else {
            if(typeof opts.buttons == "string") arr.push(opts.buttons);
            else {
                arr.push(opts.buttons.title);
                if(opts.buttons.emoji) arr.push(`${opts.buttons.emoji} ${opts.buttons.title}`);
            }
        }
    }

    if(opts.command) arr.push(`/${opts.command}`, `/${opts.command}@kubstu_timetable_bot`);

    return arr;
}

/**
* Генерирует 32-символьный токен
*/
export function genToken(name:string, inst_id:number) {
   let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
   let token = "";
   for (let i=0; i<32; i++) {
       let j = Math.floor(Math.random() * (chars.length-1));
       token += chars[j];
   }
   return `${name}:${inst_id}:${token}`;
}

/**
 * Парсит группы с сайта для данного института и курса и возвращает массив с ними
 */
export async function groupsParser(inst_id: number | string, kurs: number | string) {
    let now = new Date();
    let date = (now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1)).toString();

    let url = `https://elkaf.kubstu.ru/timetable/default/time-table-student-ofo?iskiosk=0&fak_id=${inst_id}&kurs=${kurs}&ugod=${date}`;

    let res = await fetch(url, {
        headers: {
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
        },
        agent: new https.Agent({ rejectUnauthorized: false })
    });

    let text = await res.text();
    let matches = text.match(/<option.+<\/option>/g);

    if(!matches) return;

    let groups = matches.slice( matches.indexOf("<option value=\"\">Выберите группу</option>")+1, matches.length )
        .map(elm => {
            let r = elm.substring(elm.indexOf(">")+1, elm.length);
            r = r.substring(0, r.indexOf("<"));
            return r;
        });

    return groups;
}

export default {
    daysOdd,
    daysEven,
    insts,
    commandName,
    weekNumber,
    genToken,
    groupsParser
};