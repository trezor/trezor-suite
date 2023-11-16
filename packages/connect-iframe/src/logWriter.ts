import { LogMessage, LogWriter } from '@trezor/connect/src/utils/debug';

let logWorker: SharedWorker | undefined;

const initLogWriter = () => {
    // Check for SharedWorker support
    try {
        logWorker = new SharedWorker('./workers/shared-logger-worker.js');
        logWorker?.port?.start();
    } catch (error) {
        console.warn('Failed to initialize LogWorker:', error);
    }

    const logWriterFactory = (): LogWriter => ({
        add: (message: LogMessage) => {
            if (logWorker) {
                logWorker.port.postMessage({ type: 'add-log', data: message });
            }
        },
    });
    return logWriterFactory;
};

export { initLogWriter };
