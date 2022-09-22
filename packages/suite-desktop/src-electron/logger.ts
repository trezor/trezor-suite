import { app } from 'electron';
import Logger, { LogLevel, defaultOptions as loggerDefaults } from './libs/logger';
import { isDevEnv } from '@suite-common/suite-utils';

export const createLogger = () => {
    const log = {
        level: app.commandLine.getSwitchValue('log-level') || (isDevEnv ? 'debug' : 'error'),
        writeToConsole: !app.commandLine.hasSwitch('log-no-print'),
        writeToDisk: app.commandLine.hasSwitch('log-write'),
        outputFile: app.commandLine.getSwitchValue('log-file') || loggerDefaults.outputFile,
        outputPath: app.commandLine.getSwitchValue('log-path') || loggerDefaults.outputPath,
    };
    return new Logger(log.level as LogLevel, { ...log });
};
