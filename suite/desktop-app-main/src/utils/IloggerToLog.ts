import { type Log, type LogMessage as UtilsLogMessage } from '@trezor/logger';

import type { ILogger } from '../libs/logger';

type ConvertILoggerToLogParams = { serviceName: string };

const stringifyArgs = (args: unknown[]): string =>
    args
        .map(arg => {
            if (typeof arg === 'string') return arg;
            try {
                return (
                    JSON.stringify(arg, (_k, v) => {
                        if (v instanceof Error) return { message: v.toString(), stack: v.stack };
                        if (typeof v === 'bigint' || typeof v === 'number') return v.toString();

                        return `(${typeof v} redacted...)`;
                    }) ?? String(arg)
                );
            } catch {
                // circular references (e.g. a whole Device instance)
                return String(arg);
            }
        })
        .join(' ');

/** take an instance of ILogger and return mimicked instance of Log while keeping more or less the same behavior  */
export const convertILoggerToLog = (
    iLogger: ILogger,
    { serviceName }: ConvertILoggerToLogParams,
): Log => ({
    log: (...args: unknown[]) => iLogger.info(serviceName, stringifyArgs(args)),
    info: (...args: unknown[]) => iLogger.info(serviceName, stringifyArgs(args)),
    debug: (...args: unknown[]) => iLogger.debug(serviceName, stringifyArgs(args)),
    warn: (...args: unknown[]) => iLogger.warn(serviceName, stringifyArgs(args)),
    error: (...args: unknown[]) => iLogger.error(serviceName, stringifyArgs(args)),
    prefix: '',
    messages: [],
    enabled: true,
    css: '',
    MAX_ENTRIES: 1000,
    setColors: (_colors: any) => {},
    setWriter: (_logWriter: any) => {},
    addMessage: (_msg: UtilsLogMessage) => {},
    logWriter: undefined,
    getLog: (): UtilsLogMessage[] =>
        iLogger.getLog().map(log => ({
            message: [log.text],
            prefix: '',
            level: log.level,
            timestamp: log.date.getTime(),
        })),
});
