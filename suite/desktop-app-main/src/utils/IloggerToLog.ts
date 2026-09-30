import { type Log, type LogMessage as UtilsLogMessage } from '@trezor/utils';

const stringifyArgs = (args: unknown[]): string =>
    args
        .map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return `${arg.toString()} ${arg.stack ?? ''}`;
            try {
                return (
                    JSON.stringify(arg, (_k, v) => {
                        // a string returned by the replacer is serialized as is and never revisited
                        if (v instanceof Error) return v.toString();
                        // objects and arrays must be passed through untouched, otherwise the walk
                        // stops at the root (the replacer is called with the whole value first)
                        // and their keys never make it to the log
                        if (v !== null && typeof v === 'object') return v;

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
    { serviceName }: { serviceName: string },
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
