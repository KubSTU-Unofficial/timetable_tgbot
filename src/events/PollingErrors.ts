import Event from '../structures/Event.js';

export default class PollingErrorsEvent extends Event {
    name = 'polling_error' as BotEvents;

    exec(err: Error): void {
        let excludeErrors = [
            "Error: ETELEGRAM: 502 Bad Gateway"
        ]

        if (excludeErrors.includes(`${err}`)) return console.log(`${err}`)
        else {
            console.log(`"${err}"`);
            console.log(err);
        }
    }
}
