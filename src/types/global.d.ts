import TelegramBot from 'node-telegram-bot-api';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            TOKEN: string;
            KUBSTU_API: string;
        }
    }

    // Для правильной работы Date, с изменённым прототипом
    interface Date {
        getWeek(): number;
        stringDate(): string;
    }

    // Костыль, но работает
    type BotEvents = TelegramBot.MessageType | 'message';
}

export {};
