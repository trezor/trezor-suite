import { type Log, type LogWriter, type LogMessage as UtilsLogMessage } from '@trezor/utils';

/** take an instance of ILogger and return mimicked instance of Log while keeping more or less the same behavior  */
export const convertILoggerToLog = (
    iLogger: ILogger,
    { serviceName }: { serviceName: string },
): Log => ({
    log: (msg: string) => iLogger.info(serviceName, msg),
    info: (msg: string) => iLogger.info(serviceName, msg),
    debug: (msg: string) => iLogger.debug(serviceName, msg),
    warn: (msg: string) => iLogger.warn(serviceName, msg),
    error: (msg: string) => iLogger.error(serviceName, msg),
    prefix: '',
    messages: [],
    enabled: true,
    css: '',
    MAX_ENTRIES: 1000,
    setColors: (_colors: Record<string, string>) => {},
    setWriter: (_logWriter: LogWriter) => {},
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
