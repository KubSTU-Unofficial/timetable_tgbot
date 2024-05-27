import { readdirSync } from "fs";
import Event from "./Event.js";
import Scene from "./Scene.js";
import Cache from "../lib/Cache.js";
import Timer from "./Timer.js";

export default class Main {
    scenesNames = ["main", "settings", "teachers", "loginpassword"];

    run() {
        this.initEvents();
        this.initTimers();
        this.initScenes();
    }

    async initEvents() {
        for (let dirent of readdirSync("./dist/events", {withFileTypes: true})) {
            if (!dirent.name.endsWith(".js")) continue;

            console.log(`[loader] [+] Ивент ${dirent.name}`);
        
            let eventClass = (await import("../events/" + dirent.name)).default;
            let event:Event = new eventClass();

            Cache.bot.on(event.name, event.exec);
        }
    }

    async initScenes() {
        this.scenesNames.forEach(sceneName => {
            console.log(`[loader] [+] Сцена ${sceneName}`);

            Cache.scenes.push(new Scene(sceneName));
        });
    }

    async initTimers() {
        for (let dirent of readdirSync("./dist/timers", {withFileTypes: true})) {
            if (!dirent.name.endsWith("")) continue;

            console.log(`[loader] [+] Таймер ${dirent.name}`);
        
            let timerClass = (await import("../timers/" + dirent.name)).default;
            let timer:Timer = new timerClass();

            timer.init();
            // setInterval(timer.exec, timer.time);
        }
    }
}