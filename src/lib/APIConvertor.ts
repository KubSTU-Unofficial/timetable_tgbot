import fetch from "node-fetch";
import https from "https";

interface IExamsRespExam {
    "date_sd": string,
    "time_sd": string,
    "disc": {
        "disc_id": number,
        "disc_name": string
    },
    "classroom": string,
    "teacher": string
}

interface IExamsResp {
    "isok": boolean,
    "data": IExamsRespExam[],
    "error_message": string | null
}

interface IInstListResp {
    "isok": boolean,
    "data": {
        "id": number,
        "name": string,
        "fname": string
    }[],
    "error_message": string | null
}

interface IGroupResp {
    "isok": boolean,
    "data": {
        "id": number,
        "name": string,
        "inst_id": number,
        "formaob_id": number,
        "kurs": number
    }[],
    "error_message": string | null
}

const opts = {
    headers: {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
    },
    agent: new https.Agent({ rejectUnauthorized: false })
};

export async function ofo(gr:string, ugod: string | number = new Date().getFullYear() - (new Date().getMonth() >= 6 ? 0 : 1), sem: string | number = new Date().getMonth() > 5 ? 1 : 2) {
    let resp = await fetch(`${process.env.KUBSTU_API}/timetable/ofo?gr=${gr}&ugod=${ugod}&semestr=${sem}`, opts)
    .catch(console.log);

    if(resp) {
        let json:IOFOResp = await resp.json() as IOFOResp;

        json.data.map(elm => {
            if(!elm.teacher.trim()) elm.teacher = 'Не назначен';
            if(!elm.classroom.trim()) elm.teacher = 'Не назначена';

            return elm;
        });

        return json;
    }
    else return undefined;
}

export async function exam(gr:string, ugod: string | number = new Date().getFullYear() - (new Date().getMonth() >= 6 ? 0 : 1), sem: string | number = new Date().getMonth() > 5 ? 1 : 2) {
    let resp = await fetch(`${process.env.KUBSTU_API}/timetable/exam?gr=${gr}&ugod=${ugod}&semestr=${sem}`, opts)
    .catch(console.log);

    if(resp) return await resp.json() as IExamsResp;
    else return undefined;
}

export async function instList() {
    let resp = await fetch(`${process.env.KUBSTU_API}/timetable/inst-list`, opts)
    .catch(console.log);

    if(resp) return await resp.json() as IInstListResp;
    else return undefined;
}

export async function ofoGroupsList(ugod: number | string = new Date().getFullYear() - (new Date().getMonth() >= 6 ? 0 : 1), inst_id?: string | number, kurs?: string | number) {
    let resp = await fetch(`${process.env.KUBSTU_API}/timetable/gr-list?ugod=${ugod}&formaob_id=1${inst_id ? `&inst_id=${inst_id}` : ''}${inst_id ? `&kurs=${kurs}` : ''}`, opts)
    .catch(console.log);

    if(resp) {
        let json = await resp.json() as IGroupResp;

        if(!json.isok) return json;
        // Из-за какого-то бага, formaob_id=1 не работает, поэтому производим фильтрацию прямо тут
        json.data = json.data.filter(g => g.formaob_id == 1);

        return json;
    } else return undefined;
}

export default {
    ofo, exam, instList, ofoGroupsList
};