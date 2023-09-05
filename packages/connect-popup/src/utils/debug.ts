import { LogMessage, LogWriter, setLogWriter } from '@trezor/connect/src/utils/debug';

export const initSharedLogger = (workerSrc: string) => {
    const worker = new SharedWorker(workerSrc);
    worker.port.start();
    const logWriterFactory = (): LogWriter => ({
        add: (message: LogMessage) => worker.port.postMessage({ type: 'add-log', data: message }),
    });
    setLogWriter(logWriterFactory);
};
