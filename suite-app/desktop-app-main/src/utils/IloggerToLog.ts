import { Log, stringifyLogArgs } from '@trezor/logger';

import type { ILogger } from '../libs/logger';

type ConvertILoggerToLogParams = { serviceName: string };

/** take an instance of ILogger and return mimicked instance of Log while keeping more or less the same behavior  */
export const convertILoggerToLog = (
    iLogger: ILogger,
    { serviceName }: ConvertILoggerToLogParams,
): Log => {
    const log = new Log(serviceName, true);
    log.info = (...args: unknown[]) => iLogger.info(serviceName, stringifyLogArgs(args));
    log.debug = (...args: unknown[]) => iLogger.debug(serviceName, stringifyLogArgs(args));
    log.log = (...args: unknown[]) => iLogger.log(serviceName, stringifyLogArgs(args));
    log.warn = (...args: unknown[]) => iLogger.warn(serviceName, stringifyLogArgs(args));
    log.error = (...args: unknown[]) => iLogger.error(serviceName, stringifyLogArgs(args));
    log.getLog = () =>
        iLogger.getLog().map(msg => ({
            message: [msg.text],
            prefix: '',
            level: msg.level,
            timestamp: msg.date.getTime(),
        }));

    return log;
};
