import { createDeferredManager, createLazy } from '@trezor/utils';

import PingWorker from './pingWorker';

const init = async () => {
    const worker = PingWorker();

    await new Promise<void>((resolve, reject) => {
        setTimeout(() => reject(new Error('worker_timeout')), 5000);
        worker.onmessage = message => {
            if (message?.data?.payload?.success) {
                resolve();
            }
        };
        worker.onerror = error => {
            try {
                worker.terminate();
            } catch {
                // empty
            }
            reject(new Error(error.message));
        };
    });

    const deferred = createDeferredManager<boolean>();

    worker.onmessage = ({ data: { id, payload } }) => {
        deferred.resolve(id, payload.success);
    };
    worker.onerror = error => {
        deferred.rejectAll(error);
    };

    const post = (url: string) => {
        const { promiseId: id, promise } = deferred.create();
        worker.postMessage({ id, payload: { url } });

        return promise;
    };

    return { post };
};

const lazy = createLazy(init);

export const ping = (url: string) => lazy.getOrInit().then(({ post }) => post(url));
