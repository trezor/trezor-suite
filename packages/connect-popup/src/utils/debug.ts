import { LogMessage, LogWriter, initLog } from '@trezor/connect/src/utils/debug';

export const initSharedLogger = (workerSrc: string) => {
    try {
        if (!SharedWorker) {
            throw new Error('SharedWorker is not supported');
        }
        const worker = new SharedWorker(workerSrc);
        worker.port.start();
        const logWriter: LogWriter = {
            add: (message: LogMessage) =>
                worker.port.postMessage({ type: 'add-log', data: message }),
        };
        return initLog('@trezor/connect-popup', false, logWriter);
    } catch (error) {
        console.warn('Failed to initialize LogWorker:', error);
        return initLog('@trezor/connect-popup');
    }
};
