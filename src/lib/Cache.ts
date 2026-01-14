import TelegramBot from 'node-telegram-bot-api';
import OGroup from '../structures/OGroup.js';
import ZGroup from '../structures/ZGroup.js';
import Scene from '../structures/Scene.js';
import User from '../structures/User.js';
import Group from '../shared/structures/Group.js';
import Query from '../structures/Query.js';

class Cache {
    bot!: TelegramBot;
    users = new Map<number, User>();
    groups = new Map<string, IUnifiedGroup>();
    scenes: Scene[] = [];
    queries: Query[] = [];

    /**
     * Инициализирует инстанс бота. Должен вызываться один раз при старте.
     */
    init() {
        this.bot = new TelegramBot(process.env.TOKEN, {
            polling: {
                params: {
                    allowed_updates: ["message", "callback_query", "polling_error"],
                }
            }
        });
    }

    async getUser(userId: number) {
        if (this.users.has(userId)) return this.users.get(userId)!;

        let newUser = await new User(userId).init();

        this.users.set(userId, newUser);

        return newUser;
    }

    async getGroup(name: string, instId: number): Promise<IUnifiedGroup> {
        if (this.groups.has(name)) return this.groups.get(name)!;

        let newGroup = await ((await Group.isZFOGroup(name)) ? new ZGroup(name, instId) : new OGroup(name, instId)).init();

        this.groups.set(name, newGroup);

        return newGroup;
    }
}


export default new Cache();
