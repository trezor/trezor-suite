import type {
    TransactionStorePort,
    TransactionStorePortMessage,
} from '@suite-common/transaction-store';

type MessageListener = (message: TransactionStorePortMessage) => void;

export type BufferedPort = {
    port: TransactionStorePort;
    /** Delivers what arrived so far to every listener, then passes messages straight through. */
    open: () => void;
    /** Stops listening on the worker's port. */
    dispose: () => void;
};

/**
 * The worker's port, holding back the app's messages until the store has started and all its
 * listeners are attached. The app may call the store right after spawning the worker.
 */
export const startBufferedPort = (workerPort: TransactionStorePort): BufferedPort => {
    let buffered: TransactionStorePortMessage[] | null = [];
    const listeners = new Set<MessageListener>();

    const onMessage = (message: TransactionStorePortMessage) => {
        if (buffered !== null) {
            buffered.push(message);

            return;
        }
        listeners.forEach(listener => listener(message));
    };
    workerPort.addEventListener('message', onMessage);

    return {
        port: {
            postMessage: message => workerPort.postMessage(message),
            addEventListener: (_type, listener) => {
                listeners.add(listener);
            },
            removeEventListener: (_type, listener) => {
                listeners.delete(listener);
            },
        },
        open: () => {
            const pending = buffered ?? [];
            buffered = null;
            pending.forEach(message => listeners.forEach(listener => listener(message)));
        },
        dispose: () => {
            workerPort.removeEventListener('message', onMessage);
            listeners.clear();
            buffered = null;
        },
    };
};
