import TelegramBot from 'node-telegram-bot-api';
import Group from '../structures/Group.js';
import Scene from '../structures/Scene.js';
import User from '../structures/User.js';

class Cache {
    bot: TelegramBot = new TelegramBot(process.env.TOKEN, { polling: true });
    users: User[] = [];
    groups: Group[] = [];
    scenes: Scene[] = [];

    async getUser(userId: number) {
        let user = this.users.find((u) => u.id == userId);

        if (user) return user;
        else {
            let newUser = new User(userId);

            await newUser.init();

            this.users.push(newUser);

            return newUser;
        }
    }

    getGroup(name: string, instId: number) {
        let group = this.groups.find((u) => u.name == name);

        if (group) return group;
        else {
            let newGroup = new Group(name, instId);

            this.groups.push(newGroup);

            return newGroup;
        }
    }
}

export default new Cache();
