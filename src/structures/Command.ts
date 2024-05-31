import User from "./User.js";
import { Message } from "node-telegram-bot-api";
import Middleware from "./Middleware.js";

export default abstract class Command {
    abstract name: CommandName;
    abstract sceneName: string[];

    middlewares:Middleware[] = [];

    static commandName(opts: CommandName) {
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

    abstract exec(user: User, msg: Message): Promise<void>;
}