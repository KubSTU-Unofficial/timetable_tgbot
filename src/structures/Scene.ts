import Command from './Command.js';

export default class Scene {
    private commandMap = new Map<string, Command>();
    private catchAllCommand?: Command;

    constructor(
        public name: string,
        public commands: Command[] = []
    ) {
        this.buildSceneCommandMap();
    }

    private buildSceneCommandMap() {
        for (const command of this.commands) {
            const aliases = command.getAliases();

            if (aliases.length === 0) {
                if (this.catchAllCommand) console.warn(`[loader] Внимание: в сцене "${this.name}" обнаружено несколько "безымянных" команд. Будет использоваться только одна.`);

                this.catchAllCommand = command;
            } else {
                for (const alias of aliases) {
                    this.commandMap.set(alias, command);
                }
            }
        }
    }

    findCommand(text: string): Command | undefined {
        // Сначала ищем точное совпадение
        const command = this.commandMap.get(text);
        if (command) return command;

        // Если не нашли, возвращаем "безымянную" команду
        return this.catchAllCommand;
    }
}
