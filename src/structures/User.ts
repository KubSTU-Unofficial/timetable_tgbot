import Scene from './Scene.js';
import Users from '../shared/models/TgUsersModel.js';
import Cache from '../lib/Cache.js';
import { KeyboardButton } from 'node-telegram-bot-api';
import { format } from 'date-fns';

// TODO: Исправить возвраты функций

export default class User {
    scene?: Scene;

    group?: IUnifiedGroup;
    notifications: boolean = false;
    emoji: boolean = true;
    showSettings: boolean = true;
    showTools: boolean = true;
    token?: string | null;

    constructor(public id: number) { }

    /**
     * Инициализация. Получение данных из БД
     */
    async init() {
        let userData = await Users.findOne({ userId: this.id }).lean().exec();

        if (userData?.inst_id && userData?.group) {
            this.group = await Cache.getGroup(userData.group, userData.inst_id);
            this.notifications = userData?.notifications ?? false;
            this.emoji = userData?.emoji ?? true;
            this.showSettings = userData?.showSettings ?? true;
            this.showTools = userData?.showTools ?? true;
            this.token = userData?.token;
        }

        return this;
    }

    /**
     * Обновление данных в БД и в классе
     */
    async updateData(opt: {
        inst_id?: number;
        group?: string;
        notifications?: boolean;
        emoji?: boolean;
        showSettings?: boolean;
        showTools?: boolean;
    }) {
        await Users.findOneAndUpdate({ userId: this.id }, opt, { upsert: true });

        if (opt.inst_id != undefined && opt.group != undefined) this.group = await Cache.getGroup(opt.group, opt.inst_id); // this.setGroup(opt.group, opt.instId);

        if (opt.notifications != undefined) this.notifications = opt.notifications;
        if (opt.emoji != undefined) this.emoji = opt.emoji;
        if (opt.showSettings != undefined) this.showSettings = opt.showSettings;
        if (opt.showTools != undefined) this.showTools = opt.showTools;
    }

    setScene(sceneName: string) {
        this.scene = Cache.scenes.find((x) => x.name == sceneName);
    }

    /**
     * Установка токена
     */
    async setToken(token: string) {
        this.token = token;

        let userData = await Users.findOne({ userId: this.id }).exec();

        if (userData) {
            userData.token = token;
            userData.save().catch(console.log);
        }
    }

    /**
     * Удаление пользователя из БД
     */
    async delete() {
        return Users.findOneAndDelete({ userId: this.id });
        // TODO: Сделать удаление из массива Cache.users
    }

    updateLastActivity() {
        Users.updateOne(
            { userId: this.id },
            { $set: { lastActivity: new Date() } }
        ).exec().catch(console.log);
    }

    // TODO: Организовать клавиатуры лучше

    /**
     * Получение главной клавиатуры
     */
    getMainKeyboard(): KeyboardButton[][] {
        let arr = [
            [
                {
                    text: (this.emoji ? '⏺️ ' : '') + 'Сегодняшнее',
                },
                {
                    text: (this.emoji ? '▶️ ' : '') + 'Завтрашнее',
                },
            ],
            [
                {
                    text: (this.emoji ? '⏩ ' : '') + 'Ближайшее',
                },
                {
                    text: (this.emoji ? '🔀 ' : '') + 'Выбрать день',
                },
            ],
        ];

        if (this.showTools) arr.push([{ text: (this.emoji ? '🛠 ' : '') + 'Инструменты' }]);
        if (this.showSettings) arr.push([{ text: (this.emoji ? '⚙️ ' : '') + 'Настройки' }]);

        return arr;
    }

    /**
     * Получение клавиатуры настроек
     */
    getSettingsKeyboard(): KeyboardButton[][] {
        return [
            [
                {
                    text: this.notifications
                        ? (this.emoji ? '🔕 ' : '') + 'Выключить напоминания'
                        : (this.emoji ? '🔔 ' : '') + 'Включить напоминания',
                },
                {
                    text: this.emoji ? (this.emoji ? '🙅‍♂️ ' : '') + 'Выключить эмодзи' : 'Включить эмодзи', // Тут нет эмодзи, потому что оно тут в любом случае будет отсутствовать
                },
            ],
            [
                {
                    text: (this.emoji ? '⚙️ ' : '') + 'Перенастроить бота',
                },
                {
                    text: this.showSettings ? (this.emoji ? '⚙️ ' : '') + 'Убрать настройки' : (this.emoji ? '⚙️ ' : '') + 'Показать настройки',
                },
            ],
            [
                {
                    text: this.showTools
                        ? (this.emoji ? '⚙️ ' : '') + 'Убрать инструменты'
                        : (this.emoji ? '⚙️ ' : '') + 'Показать инструменты',
                },
            ],
            [
                {
                    text: (this.emoji ? '🛑 ' : '') + 'Отмена',
                },
            ],
        ];
    }

    /**
     * Получение клавиатуры инструментов
     */
    getToolsKeyboard(): KeyboardButton[][] {
        return [
            [
                { text: (this.emoji ? '👨‍🏫 ' : '') + 'Расписания преподавателей' },
            ], [
                { text: (this.emoji ? '🔍 ' : '') + 'Свободная аудитория' },
            ], [
                { text: (this.emoji ? '🛑 ' : '') + 'Отмена' },
            ],
        ];
    }

    /**
     * Получение клавиатуры инструмента "расписание преподавателей"
     * */
    getToolsTeacherKeyboard(dateToday: Date = new Date()) {
        let buttons: { text: string, callback_data: string }[][] = [[]];

        let dateTommorow = new Date(dateToday.valueOf() + 1000 * 60 * 60 * 24);
        let dateYesterday = new Date(dateToday.valueOf() - 1000 * 60 * 60 * 24);

        let dateAfterWeek = new Date(dateToday.valueOf() + 1000 * 60 * 60 * 24 * 7);
        let dateBeforeWeek = new Date(dateToday.valueOf() - 1000 * 60 * 60 * 24 * 7);

        // Скип воскресенья
        if (dateTommorow.getDay() == 0) dateTommorow = new Date(dateTommorow.valueOf() + 1000 * 60 * 60 * 24);
        if (dateYesterday.getDay() == 0) dateYesterday = new Date(dateYesterday.valueOf() - 1000 * 60 * 60 * 24);

        if (dateBeforeWeek.valueOf() >= Date.now() - 1000 * 60 * 60 * 24 * 3) buttons[0].push({ text: this.emoji ? "⏪" : "<<", callback_data: `TTT__set__${format(dateBeforeWeek, 'dd.MM.yyyy')}` });
        if (dateYesterday.valueOf() >= Date.now() - 1000 * 60 * 60 * 24 * 3) buttons[0].push({ text: this.emoji ? "◀️" : "<", callback_data: `TTT__set__${format(dateYesterday, 'dd.MM.yyyy')}` });

        if (dateTommorow.valueOf() <= Date.now() + 1000 * 60 * 60 * 24 * 30) buttons[0].push({ text: this.emoji ? "▶️" : ">", callback_data: `TTT__set__${format(dateTommorow, 'dd.MM.yyyy')}` });
        if (dateAfterWeek.valueOf() <= Date.now() + 1000 * 60 * 60 * 24 * 30) buttons[0].push({ text: this.emoji ? "⏩" : ">>", callback_data: `TTT__set__${format(dateAfterWeek, 'dd.MM.yyyy')}` });

        return buttons;
    }
}
