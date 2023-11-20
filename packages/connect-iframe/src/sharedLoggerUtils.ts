import { LogMessage, LogWriter } from '@trezor/connect/src/utils/debug';

interface LogWorkerClass extends SharedWorker {
    new (): SharedWorker;
}

let logWorker: SharedWorker | undefined;

const logWriterFactory = (logWorker: SharedWorker | undefined) => (): LogWriter => ({
    add: (message: LogMessage) => {
        if (logWorker) {
            logWorker.port.postMessage({ type: 'add-log', data: message });
        }
    },
});

export const initLogWriterWithWorker = (LogWorker: LogWorkerClass) => {
    try {
        logWorker = new LogWorker();
        logWorker?.port?.start();
    } catch (error) {
        console.warn('Failed to initialize LogWorker:', error);
    }
    return logWriterFactory(logWorker);
};

export const initLogWriterWithSrcPath = (workerSrc: string) => {
    try {
        logWorker = new SharedWorker(workerSrc);
    } catch (error) {
        console.warn('Failed to initialize LogWorker:', error);
    }
    return logWriterFactory(logWorker);
};
