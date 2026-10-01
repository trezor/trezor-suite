import type { LogLevel } from '@trezor/logger';

export type LogEvent = {
    level: LogLevel;
    payload: string;
};
