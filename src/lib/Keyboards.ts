export let fakKeyboard = [
    [
        {
            text: 'ФНГиЭ',
            callback_data: 'settings_fak_495',
        },
        {
            text: 'ФИТиК',
            callback_data: 'settings_fak_516',
        },
        {
            text: 'ФБиПП',
            callback_data: 'settings_fak_490',
        },
        {
            text: 'ФЭУиБ',
            callback_data: 'settings_fak_29',
        },
    ],
    [
        {
            text: 'ФАСиАД',
            callback_data: 'settings_fak_538',
        },
        {
            text: 'ФИМиТ',
            callback_data: 'settings_fak_539',
        },
        {
            text: 'ФФН',
            callback_data: 'settings_fak_540',
        },
        {
            text: 'ИТК',
            callback_data: 'settings_fak_541',
        },
    ],
    [
        {
            text: 'ПОдИО',
            callback_data: 'settings_fak_34',
        },
        {
            text: 'НПИ',
            callback_data: 'settings_fak_50',
        },
        {
            text: 'АМТИ',
            callback_data: 'settings_fak_52',
        },
    ]
];

export const kursKeyboard = [
    [
        {
            text: '1',
            callback_data: 'settings_kurs_1',
        },
        {
            text: '2',
            callback_data: 'settings_kurs_2',
        },
        {
            text: '3',
            callback_data: 'settings_kurs_3',
        },
        {
            text: '4',
            callback_data: 'settings_kurs_4',
        },
        {
            text: '5',
            callback_data: 'settings_kurs_5',
        },
        {
            text: '6',
            callback_data: 'settings_kurs_6',
        },
    ],
];

export const mainKeyboard = [
    [
        {
            text: '⏺️ Сегодняшнее',
        },
        {
            text: '▶️ Завтрашнее',
        },
    ],
    [
        {
            text: '⏩ Ближайшее',
        },
        {
            text: '🔀 Выбрать день',
        },
    ],
    [
        {
            text: '⚙️ Настройки',
        },
    ],
];

export default {
    fakKeyboard,
    kursKeyboard,
    mainKeyboard,
};
