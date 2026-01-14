import { glob } from 'glob';
import Event from './Event.js';
import Scene from './Scene.js';
import Cache from '../lib/Cache.js';
import Query from './Query.js';
import Command from './Command.js';

export default class Main {
    scenesNames = ['main', 'selectDay', 'settings', 'teachers', 'tools'];

    async run() {
        Cache.init();

        await this.initEvents();

        const { commands } = await this.loadAllModules();
        this.buildSceneCache(commands);
    }

    private async loadModules<T>(pattern: string): Promise<T[]> {
        const modules: T[] = [];
        const files = await glob(`src/${pattern}`, { cwd: process.cwd(), absolute: true });

        for (const file of files) {
            try {
                const moduleUrl = 'file://' + file;
                const moduleClass = (await import(moduleUrl)).default;
                if (moduleClass) modules.push(new moduleClass());
            } catch (error) {
                console.error(`Failed to load module at ${file}:`, error);
            }
        }
        return modules;
    }

    async initEvents() {
        const events = await this.loadModules<Event>('events/**/*.ts');
        for (const event of events) {
            console.log(`[loader] [+] Ивент ${event.constructor.name}`);
            Cache.bot.on(event.name, event.exec.bind(event));
        }
    }

    private async loadAllModules() {
        const commands = await this.loadModules<Command>('commands/**/*.ts');
        Cache.queries = await this.loadModules<Query>('queries/**/*.ts');

        commands.forEach(c => console.log(`[loader] [+] Команда ${c.constructor.name}`));
        Cache.queries.forEach(q => console.log(`[loader] [+] Запрос ${q.constructor.name}`));

        return { commands };
    }

    private buildSceneCache(commands: Command[]) {
        this.scenesNames.forEach((sceneName) => {
            console.log(`[loader] [+] Сцена ${sceneName}`);

            const sceneCommands = commands.filter(c => c.sceneName.length === 0 || c.sceneName.includes(sceneName));

            Cache.scenes.push(new Scene(sceneName, sceneCommands));
        });
    }
}
