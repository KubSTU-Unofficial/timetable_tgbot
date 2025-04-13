import { readdirSync } from 'fs';
import Event from './Event.js';
import Scene from './Scene.js';
import Cache from '../lib/Cache.js';

export default class Main {
    scenesNames = ['main', 'selectDay', 'settings', 'teachers'];

    run() {
        this.initEvents();
        this.initScenes();
    }

    async initEvents() {
        for (let dirent of readdirSync('./dist/events', { withFileTypes: true })) {
            if (!dirent.name.endsWith('.js')) continue;

            console.log(`[loader] [+] Ивент ${dirent.name}`);

            let eventClass = (await import('../events/' + dirent.name)).default;
            let event: Event = new eventClass();

            Cache.bot.on(event.name, event.exec);
        }
    }

    async initScenes() {
        this.scenesNames.forEach((sceneName) => {
            console.log(`[loader] [+] Сцена ${sceneName}`);

            Cache.scenes.push(new Scene(sceneName));
        });
    }
}
