import { Deferred, createDeferred } from '@trezor/utils';

export const createPopupPromiseManager = () => {
    let _popupPromise: Deferred<void> | undefined; // Waiting for popup handshake

    const ensure = () => _popupPromise ?? (_popupPromise = createDeferred());

    const wait = () => ensure().promise;

    const resolve = () => ensure().resolve();

    const isWaiting = () => !!_popupPromise;

    const reject = (error: Error) => {
        _popupPromise?.reject(error);
        _popupPromise = undefined;
    };

    const clear = () => {
        _popupPromise = undefined;
    };

    return { wait, isWaiting, clear, resolve, reject };
};
