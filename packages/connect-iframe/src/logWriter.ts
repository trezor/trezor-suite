// @ts-expect-error (typescript does not know this is worker constructor, this is done by webpack)
import LogWorker from './sharedLoggerWorker';
import { LogMessage, LogWriter } from '@trezor/connect/src/utils/debug';

const logWorker = new LogWorker();
logWorker.port.start();

export const logWriterFactory = (): LogWriter => ({
    add: (message: LogMessage) => logWorker.port.postMessage({ type: 'add-log', data: message }),
});
