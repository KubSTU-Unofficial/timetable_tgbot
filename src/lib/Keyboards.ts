import { KeyboardButton } from "node-telegram-bot-api";
import { daysOdd, daysEven } from "./Utils.js";

export let instKeyboard = [
    [
        {
            text: "ИНГиЭ",
            callback_data: "settings_inst_495",
        },{
            text: "ИКСиИБ",
            callback_data: "settings_inst_516",
        },{
            text: "ИПиПП",
            callback_data: "settings_inst_490",
        },{
            text: "ИЭУиБ",
            callback_data: "settings_inst_29",
        },
    ],[
        {
            text: "ИСиТИ",
            callback_data: "settings_inst_538",
        },{
            text: "ИМРИТиТС",
            callback_data: "settings_inst_539",
        },{
            text: "ИФН",
            callback_data: "settings_inst_540",
        },{
            text: "ИТК",
            callback_data: "settings_inst_541",
        },
    ],
];

export const kursKeyboard = [
    [
        {
            text: "1",
            callback_data: "settings_kurs_1",
        },{
            text: "2",
            callback_data: "settings_kurs_2",
        },{
            text: "3",
            callback_data: "settings_kurs_3",
        },{
            text: "4",
            callback_data: "settings_kurs_4",
        },{
            text: "5",
            callback_data: "settings_kurs_5",
        },{
            text: "6",
            callback_data: "settings_kurs_6",
        },
    ],
];

export const mainKeyboard = [
    [
        {
            text: "⏺️ Сегодняшнее",
        },{
            text: "▶️ Завтрашнее",
        }
    ],[
        {
            text: "⏩ Ближайшее"
        }, {
            text: "🔀 Выбрать день",
        }
    ],[
        {
            text: "⚙️ Настройки",
        },
    ],
];

// export const anotherDay = [
//     daysOdd.slice().map((elm) => {
//         return { text: elm };
//     }),
//     daysEven.slice().map((elm) => {
//         return { text: elm };
//     }),
// ];



// export const anotherDay = [
//     days.slice().map((elm, i) => {
//         return { text: elm, callback_data: `anotherDay_n${i}` };
//     }),
//     daysEven.slice().map((elm, i) => {
//         return { text: elm, callback_data: `anotherDay_e${i}` };
//     }),
// ];

export function selectingDayKeyboard(date: Date = new Date()):KeyboardButton[][] {
    let out:KeyboardButton[][] = [ daysOdd.slice().map((elm) => ({ text: elm })), daysEven.slice().map((elm) => ({ text: elm })) ];

    if(date.getWeek()%2 == 0) out.reverse();

    return out;
}

export function settingsKeyboard(notifications: boolean):KeyboardButton[][] {

    return [
        [
            {
                text: notifications ? "🔕 Выключить напоминания" : "🔔 Включить напоминания"
            }
        ],[
            {
                text: "⚙️ Перенастроить бота"
            }
        ],[
            {
                text: "🛑 Отмена"
            }
        ]
    ];
}

export default {
    instKeyboard,
    kursKeyboard,
    mainKeyboard,
    selectingDayKeyboard,
    settingsKeyboard
};