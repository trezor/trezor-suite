// @ts-expect-error (typescript does not know this is worker constructor, this is done by webpack)
import LogWorker from './sharedLoggerWorker';
import { LogMessage, LogWriter } from '@trezor/connect/src/utils/debug';

let logWorker: SharedWorker | undefined;

// Check for SharedWorker support
if (SharedWorker) {
    try {
        // Initialize LogWorker
        logWorker = new LogWorker();
        logWorker?.port?.start();
    } catch (error) {
        console.warn('Failed to initialize LogWorker:', error);
    }
} else {
    console.warn('SharedWorker is not supported');
}

const logWriterFactory = (): LogWriter | undefined => {
    if (logWorker) {
        return {
            add: (message: LogMessage) => {
                logWorker?.port.postMessage({ type: 'add-log', data: message });
            },
        };
    }
    console.warn('Failed to initialize LogWorker');
};

export { logWriterFactory };
