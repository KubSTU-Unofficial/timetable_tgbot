export default abstract class Timer {
    /**
     * Время в миллисекундах
     */
    // abstract time: number;
    abstract exec(): void;
    abstract init(): void;
}