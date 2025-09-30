import TelegramBot from 'node-telegram-bot-api';
import OGroup from '../structures/OGroup.js';
import ZGroup from '../structures/ZGroup.js';
import Scene from '../structures/Scene.js';
import User from '../structures/User.js';
import BaseGroup from '../shared/structures/Group.js';
import Query from '../structures/Query.js';

class Cache {
    bot: TelegramBot = new TelegramBot(process.env.TOKEN, { polling: true });
    users = new Map<number, User>();
    // groups: IUnifiedGroup[] = [];
    groups = new Map<string, IUnifiedGroup>();
    scenes: Scene[] = [];
    queries: Query[] = [];

    async getUser(userId: number) {
        if (this.users.has(userId)) return this.users.get(userId)!;

        let newUser = await new User(userId).init();

        this.users.set(userId, newUser);

        return newUser;
    }

    getGroup(name: string, instId: number): IUnifiedGroup {
        if (this.groups.has(name)) return this.groups.get(name)!;

        let newGroup = BaseGroup.isZFOGroup(name) ? new ZGroup(name, instId) : new OGroup(name, instId);

        this.groups.set(name, newGroup);

        return newGroup;
    }
}

export default new Cache();
