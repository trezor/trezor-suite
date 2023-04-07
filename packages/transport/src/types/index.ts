import * as Messages from './messages';

export * from './apiCall';

export type MessageFromTrezor = {
    type: keyof Messages.MessageType;
    message: Record<string, unknown>;
};

export type Session = null | string;
export type Descriptor = { path: string; session?: Session };

export interface Logger {
    debug(...args: any): void;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
}
