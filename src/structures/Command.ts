import User from './User.js';
import { Message } from 'node-telegram-bot-api';
import Middleware from './Middleware.js';

interface CommandName {
    buttons?: Array<{ title: string; emoji?: string } | string> | { title: string; emoji?: string } | string;
    command?: string;
}

export default abstract class Command {
    abstract name: CommandName;
    abstract sceneName: string[];

    middlewares: Middleware[] = [];

    getAliases(): string[] {
        const aliases: string[] = [];
        const { buttons, command } = this.name;

        if (buttons) {
            const buttonsArray = Array.isArray(buttons) ? buttons : [buttons];
            for (const btn of buttonsArray) {
                if (typeof btn === 'string') {
                    aliases.push(btn);
                } else {
                    aliases.push(btn.title);
                    if (btn.emoji) {
                        aliases.push(`${btn.emoji} ${btn.title}`);
                    }
                }
            }
        }

        if (command) {
            aliases.push(`/${command}`);
            aliases.push(`/${command}@kubstu_timetable_bot`);
        }

        return aliases;
    }

    abstract exec(user: User, msg: Message): Promise<unknown>;
}
