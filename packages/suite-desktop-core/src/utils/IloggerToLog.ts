import { Log, LogMessage as UtilsLogMessage } from '@trezor/utils';

/** take an instance of ILogger and return mimicked instance of Log while keeping more or less the same behavior  */
export const convertILoggerToLog = (
    iLogger: ILogger,
    { serviceName }: { serviceName: string },
): Log => {
    return {
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
        setColors: (_colors: any) => {},
        setWriter: (_logWriter: any) => {},
        addMessage: (_msg: UtilsLogMessage) => {},
        logWriter: undefined,
        getLog: (): UtilsLogMessage[] => {
            return iLogger.getLog().map(log => ({
                message: [log.text],
                prefix: '',
                level: log.level,
                timestamp: log.date.getTime(),
            }));
        },
    };
};
