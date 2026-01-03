import TelegramBot from 'node-telegram-bot-api';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            TOKEN: string;
            KUBSTU_API: string;
        }
    }

    interface Console {
        dlog(...args: unknown[]): void;
    }

    // Для правильной работы Date, с изменённым прототипом
    interface Date {
        getWeek(): number;
    }

    // Костыль, но работает
    type BotEvents = TelegramBot.MessageType | 'message';

    interface IUnifiedGroup {
        name: string;

        getTextSchedule(date: Date = new Date(), opts: { showDate?: boolean } = {}): Promise<string>;
        getTextNextSchedule(): Promise<string>;
        getTextFullSchedule(startDate: Date): Promise<string[] | null>;

        getTextExams(): Promise<string | undefined>;
        getTextEvents(date = new Date()): Promise<string | null>;

        getRawTeachersList(): Promise<string[]>;
        getRawTeachersAndDisciplines(): Promise<{ [key: string]: { [key: string]: string[] } }>;

        isZFOGroup(): Promise<boolean> | boolean;

        selectDayKeyboard(date: Date = new Date()): KeyboardButton[][];
    }
}

export {};
