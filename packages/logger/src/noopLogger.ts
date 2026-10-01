import type { CreateLogger, Logger } from './logs';

export const noopLogger: Logger = {
    info: () => {},
    debug: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
};

export const noopCreateLogger: CreateLogger = () => noopLogger;
