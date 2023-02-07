export type LogLevel = 'debug' | 'log' | 'warn' | 'error';

export type LogEvent = {
    level: LogLevel;
    payload: unknown[];
};

export interface Logger {
    debug(message: unknown, ...params: unknown[]): void;
    log(message: unknown, ...params: unknown[]): void;
    warn(message: unknown, ...params: unknown[]): void;
    error(message: unknown, ...params: unknown[]): void;
}
