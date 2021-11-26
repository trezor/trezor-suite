import { session } from 'electron';

// Should be used for all webRequest.on* events as there can be only
// one listener for each of them, but sometimes we need to bind more
// of them
export const createInterceptor = (): RequestInterceptor => {
    let beforeRequestListeners: BeforeRequestListener[] = [];

    const filter = { urls: ['*://*/*'] };
    session.defaultSession.webRequest.onBeforeRequest(filter, async (details, callback) => {
        for (let i = 0; i < beforeRequestListeners.length; ++i) {
            /* eslint-disable no-await-in-loop */
            const res = await beforeRequestListeners[i](details);
            if (res) {
                callback(res);
                return;
            }
        }
        callback({ cancel: false });
    });

    const onBeforeRequest = (listener: BeforeRequestListener) => {
        beforeRequestListeners.push(listener);
    };

    const offBeforeRequest = (listener: BeforeRequestListener) => {
        beforeRequestListeners = beforeRequestListeners.filter(f => f !== listener);
    };

    return {
        onBeforeRequest,
        offBeforeRequest,
    };
};
