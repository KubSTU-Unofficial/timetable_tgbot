import TelegramBot from "node-telegram-bot-api";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            TOKEN: string;
        }
    }

    interface Date {
        getWeek(): number;
        stringDate(): string;
    }

    interface ILesson {
        number: number,
        time: string,
        name: string,
        paraType: string,
        teacher?: string,
        auditory?: string,
        remark?: string,
        percent?: string,
        period?: string,
        flow?: boolean
    }

    interface IDay {
        daynum: number,
        even: boolean,
        daySchedule: ILesson[]
    }
    
    // interface ISchedule {
    //     updateDate: Date,
    //     days: IDay[]
    // }

    interface CommandName {
        buttons?: Array< { title: string, emoji?: string } | string> | { title: string, emoji?: string } | string,
        command?: string
    }

    interface ITeacherLesson {
        group: string,
        number: number,
        time: string,
        name: string,
        paraType: string,
        auditory: string,
        remark?: string,
        percent?: string,
        period?: string,
        flow?: boolean
    }
    
    interface ITeacherDay {
        daynum: number,
        even: boolean,
        daySchedule: ITeacherLesson[]
    }

    // Костыль, но работает
    type BotEvents = TelegramBot.MessageType | 'message'
}

export {};