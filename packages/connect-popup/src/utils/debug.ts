import { LogMessage, LogWriter } from '@trezor/connect/src/utils/debug';

let worker: SharedWorker | undefined;

export const logWriterFactory = (): LogWriter => ({
    add: (message: LogMessage) => {
        worker?.port.postMessage({ type: 'add-log', data: message });
    },
});

export const initSharedLogger = (workerSrc: string) => {
    try {
        if (!SharedWorker) {
            throw new Error('SharedWorker is not supported');
        }
        worker = new SharedWorker(workerSrc);
        worker.port.start();
        return logWriterFactory();
    } catch (error) {
        console.warn('Failed to initialize LogWorker:', error);
        return {
            add: (_message: LogMessage) => {},
        };
    }
};
