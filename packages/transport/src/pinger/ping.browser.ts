import { createDeferredManager, createLazy } from '@trezor/utils';

const init = async () => {
    const worker = new Worker(
        new URL(
            /* webpackChunkName: "workers/ping-worker" */
            './pingWorker',
            import.meta.url,
        ),
        { type: 'module' },
    );

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
        deferred.rejectAll(error.error instanceof Error ? error.error : new Error(error.message));
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
