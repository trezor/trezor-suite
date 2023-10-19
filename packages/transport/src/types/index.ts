export * from './apiCall';

export type Session = null | string;
export type Descriptor = { path: string; session?: Session };

export interface Logger {
    debug(...args: any): void;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
}
