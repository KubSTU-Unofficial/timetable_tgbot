import TelegramBot from "node-telegram-bot-api";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            TOKEN: string;
            KUBSTI_API: string;
        }
    }

    // Нужны для APIConvertor и structures/Group
    interface IOFORespPara {
        "nedtype": {
            "nedtype_id": number,
            "nedtype_name": string
        },
        "dayofweek": {
            "dayofweek_id": number,
            "dayofweek_name": string
        },
        "pair": number,
        "kindofnagr": {
            "kindofnagr_id": number,
            "kindofnagr_name": string
        },
        "disc": {
            "disc_id": number,
            "disc_name": string
        },
        "ned_from": number,
        "ned_to": number,
        "persent_of_gr": number,
        "ispotok": boolean,
        "classroom": string,
        "isdistant": boolean,
        "teacher": string,
        "comment": string
    }
    
    interface IOFOResp {
        "isok": boolean,
        "data": IOFORespPara[],
        "error_message": string | null
    }

    // Для правильной работы Date, с изменённым прототипом
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