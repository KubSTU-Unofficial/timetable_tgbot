import Main from './structures/Main.js';
import bootstrap from './shared/bootstrap.js';

// TODO: Эта штука точно нужна?
console.dlog = (...args: unknown[]) => {
    if (process.argv.includes('--debug')) console.log(...args);
};

async function startApp() {
    await bootstrap();

    const main = new Main(); // Создание класса и запуск начальных процессов
    main.run();
}

startApp();
