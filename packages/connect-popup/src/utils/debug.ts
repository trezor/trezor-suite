import { LogMessage, LogWriter, initLog } from '@trezor/connect/src/utils/debug';

export const initSharedLogger = (workerSrc: string) => {
    const worker = new SharedWorker(workerSrc);
    worker.port.start();
    const logWriter: LogWriter = {
        add: (message: LogMessage) => worker.port.postMessage({ type: 'add-log', data: message }),
    };
    return initLog('@trezor/connect-popup', false, logWriter);
};
