import BaseUser from "../shared/structures/User.js";
import Scene from "./Scene.js";
import Group from "./Group.js";
import Users from "../shared/models/TgUsersModel.js";
import Cache from "../lib/Cache.js";
import { KeyboardButton } from "node-telegram-bot-api";

// TODO: Исправить возвраты функций

export default class User extends BaseUser {
    scene?: Scene;

    group?: Group;
    notifications: boolean = false;
    emoji: boolean = true;
    showSettings: boolean = true;
    showTeachers: boolean = true;
    token?: string | null;

    /**
     * Используется для временного хранения данных при настройке
     */
    dataBuffer: {
        id: number,
        inst_id?: number,
        kurs?: number
    }[] = [];

    /**
     * Инициализация. Получение данных из БД
     */
    async init() {
        let userData = await Users.findOne({ userId: this.id }).exec();

        if(userData?.inst_id && userData?.group) {
            this.group = Cache.getGroup(userData.group, userData.inst_id);
            this.notifications = userData?.notifications ?? false;
            this.emoji = userData?.emoji ?? true;
            this.showSettings = userData?.showSettings ?? true;
            this.showTeachers = userData?.showTeachers ?? true;
            this.token = userData?.token;
        }
    }

    /**
     * Обновление данных в БД и в классе
     */
    async updateData(opt: { inst_id?: number, group?: string, notifications?: boolean, emoji?: boolean, showSettings?: boolean, showTeachers?: boolean }) {
        await Users.findOneAndUpdate({ userId: this.id }, opt, { upsert: true });

        if (opt.inst_id != undefined && opt.group != undefined) this.group = Cache.getGroup(opt.group, opt.inst_id); // this.setGroup(opt.group, opt.instId);
        
        if (opt.notifications != undefined) this.notifications = opt.notifications;
        if (opt.emoji != undefined) this.emoji = opt.emoji;
        if (opt.showSettings != undefined) this.showSettings = opt.showSettings;
        if (opt.showTeachers != undefined) this.showTeachers = opt.showTeachers;
    }

    setScene(sceneName: string) {
        this.scene = Cache.scenes.find(x => x.name == sceneName);
    }

    /**
     * Установка токена
     */
    async setToken(token:string) {
        this.token = token;

        let userData = await Users.findOne({userId: this.id}).exec();

        if(userData) {
            userData.token = token;
            userData.save().catch(console.log);
        }
    }

    /**
     * Удаление пользователя из БД
     */
    async delete() {
        return Users.findOneAndDelete({userId: this.id});
        // TODO: Сделать удаление из массива Cache.users
    }

    async updateLastActivity() {
        let user = await Users.findOne({userId: this.id}).exec();

        if(user) {
            user.lastActivity = new Date();
            user.save().catch(console.log);
        }
    }

    /**
     * Получение главной клавиатуры
     */
    getMainKeyboard():KeyboardButton[][] {
        let arr = [
            [
                {
                    text: (this.emoji ? "⏺️ " : "") + "Сегодняшнее",
                },{
                    text: (this.emoji ? "▶️ " : "") + "Завтрашнее",
                }
            ],[
                {
                    text: (this.emoji ? "⏩ " : "") + "Ближайшее"
                }, {
                    text: (this.emoji ? "🔀 " : "") + "Выбрать день",
                }
            ]
        ];

        if(this.showTeachers) arr.push([{ text: (this.emoji ? "👨‍🏫 " : "") + "Расписания преподавателей" }]);
        if(this.showSettings) arr.push([{ text: (this.emoji ? "⚙️ " : "") + "Настройки" }]);

        return arr;
    }

    /**
     * Получение клавиатуры настроек
     */
    getSettingsKeyboard():KeyboardButton[][] {
        return [
            [
                {
                    text: this.notifications ? ( (this.emoji ? "🔕 " : "") + "Выключить напоминания") : ((this.emoji ? "🔔 " : "") + "Включить напоминания")
                },{
                    text: this.emoji ? ( (this.emoji ? "🙅‍♂️ " : "") + "Выключить эмодзи") : "Включить эмодзи" // Тут нет эмодзи, потому что оно тут в любом случае будет отсутствовать
                }
            ],[
                {
                    text: (this.emoji ? "⚙️ " : "") + "Перенастроить бота"
                },{
                    text: this.showSettings ? ( (this.emoji ? "⚙️ " : "") + "Убрать настройки") : ((this.emoji ? "⚙️ " : "") + "Показывать настройки")
                }
            ],[
                { // TODO: Заменить емодзи на другое
                    text: this.showTeachers ? ( (this.emoji ? "⚙️ " : "") + "Убрать расписания преподавателей") : ((this.emoji ? "⚙️ " : "") + "Показывать расписания преподавателей")
                }
                
            ],[
                {
                    text: (this.emoji ? "🛑 " : "") + "Отмена"
                }
            ]
        ];
    }
}