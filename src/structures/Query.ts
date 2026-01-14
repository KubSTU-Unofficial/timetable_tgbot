import { CallbackQuery } from 'node-telegram-bot-api';
import User from './User.js';

export default abstract class Query {
    abstract name: string[];

    errorCatcher(err: any) {
        let ignoreErrors = ["Error: ETELEGRAM: 400 Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message"];

        if (ignoreErrors.includes(err.toString())) {
            console.log(`"${err}"`);
            console.log(err);
        }
    }

    abstract exec(user: User, query: CallbackQuery): void;
}
