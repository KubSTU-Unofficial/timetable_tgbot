import { readdirSync } from 'fs';
import Command from './Command.js';
import Query from './Query.js';

export default class Scene {
    commands: Command[] = [];
    queries: Query[] = [];

    constructor(public name: string) {
        this.importCommands();
    }

    async importCommands() {
        for(let dirent of readdirSync('./dist/commands/', { withFileTypes: true })) {
            if(!dirent.name.endsWith('.js')) continue;

            let commandClass = (await import('../commands/' + dirent.name)).default;
            let command: Command = new commandClass();

            if(command.sceneName.length == 0 || command.sceneName.includes(this.name)) this.commands.push(command);
        }
    }
}
