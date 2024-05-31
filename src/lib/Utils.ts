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

export const days = ["ВОСКРЕСЕНЬЕ", "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"];

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

export default {
    daysOdd,
    daysEven,
    days,
    insts,
    weekNumber,
    genToken,
};