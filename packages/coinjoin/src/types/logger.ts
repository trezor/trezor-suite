export interface Logger {
    debug(message: string): void;
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export type LogLevel = keyof Logger;

export type LogEvent = {
    level: LogLevel;
    payload: string;
};
