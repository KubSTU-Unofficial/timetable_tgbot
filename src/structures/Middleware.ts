import { Message } from 'node-telegram-bot-api';
import User from './User.js';

enum MiddlewareTypes {
    Pre,
    Post,
    Test,
}

// TODO: Возможно, от них надо избавляться в пользу декораторов
export default abstract class Middleware {
    static types = MiddlewareTypes;

    type = MiddlewareTypes.Pre;

    abstract exec(user: User, msg: Message): void | number;
}
