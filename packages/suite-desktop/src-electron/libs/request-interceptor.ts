import { session } from 'electron';

// Should be used for all webRequest.on* events as there can be only
// one listener for each of them, but sometimes we need to bind more
// of them
export const createInterceptor = (): RequestInterceptor => {
    let beforeRequestListeners: BeforeRequestListener[] = [];

    let beforeSendHeadersListeners: BeforeSendHeadersListener[] = [];
    let beforeSendHeadersListenersAsync: BeforeSendHeadersListenerAsync[] = [];

    let headersReceivedListeners: HeadersReceivedListener[] = [];
    let headersReceivedListenersAsync: HeadersReceivedListenerAsync[] = [];

    const filter = { urls: ['*://*/*'] };

    session.defaultSession.webRequest.onHeadersReceived(filter, async (details, callback) => {
        let responseHeadersEffective = { ...details.responseHeaders };
        // sync listeners
        for (let i = 0; i < headersReceivedListeners.length; ++i) {
            const result = headersReceivedListeners[i](details);
            if (result) {
                responseHeadersEffective = {
                    ...responseHeadersEffective,
                    ...result.responseHeaders,
                };
            }
        }

        // async listeners
        const headersReceivedListenersResolved = await Promise.all(
            headersReceivedListenersAsync.map(listener => listener(details)),
        );
        for (let i = 0; i < headersReceivedListenersResolved.length; ++i) {
            const result = headersReceivedListenersResolved[i];
            if (result) {
                responseHeadersEffective = {
                    ...responseHeadersEffective,
                    ...result.responseHeaders,
                };
            }
        }

        callback({ cancel: false, responseHeaders: responseHeadersEffective });
    });

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        for (let i = 0; i < beforeRequestListeners.length; ++i) {
            const res = beforeRequestListeners[i](details);
            if (res) {
                callback(res);
                return;
            }
        }
        callback({ cancel: false });
    });

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, async (details, callback) => {
        let requestHeadersEffective = { ...details.requestHeaders };

        // sync listeners
        for (let i = 0; i < beforeSendHeadersListeners.length; ++i) {
            const result = beforeSendHeadersListeners[i](details);
            if (result) {
                requestHeadersEffective = {
                    ...requestHeadersEffective,
                    ...result.requestHeaders,
                };
            }
        }

        // async listeners
        const beforeSendHeadersListenersResolved = await Promise.all(
            beforeSendHeadersListenersAsync.map(listener => listener(details)),
        );
        for (let i = 0; i < beforeSendHeadersListenersResolved.length; ++i) {
            const result = beforeSendHeadersListenersResolved[i];
            if (result) {
                requestHeadersEffective = {
                    ...requestHeadersEffective,
                    ...result.requestHeaders,
                };
            }
        }

        callback({ cancel: false, requestHeaders: requestHeadersEffective });
    });

    const onBeforeRequest = (listener: BeforeRequestListener) => {
        beforeRequestListeners.push(listener);
    };

    const offBeforeRequest = (listener: BeforeRequestListener) => {
        beforeRequestListeners = beforeRequestListeners.filter(f => f !== listener);
    };

    const onBeforeSendHeaders = (listener: BeforeSendHeadersListener) => {
        beforeSendHeadersListeners.push(listener);
    };

    const offBeforeSendHeaders = (listener: BeforeSendHeadersListener) => {
        beforeSendHeadersListeners = beforeSendHeadersListeners.filter(f => f !== listener);
    };

    const onBeforeSendHeadersAsync = (listener: BeforeSendHeadersListenerAsync) => {
        beforeSendHeadersListenersAsync.push(listener);
    };

    const offBeforeSendHeadersAsync = (listener: BeforeSendHeadersListenerAsync) => {
        beforeSendHeadersListenersAsync = beforeSendHeadersListenersAsync.filter(
            f => f !== listener,
        );
    };

    const onHeadersReceived = (listener: HeadersReceivedListener) => {
        headersReceivedListeners.push(listener);
    };

    const offHeadersReceived = (listener: HeadersReceivedListener) => {
        headersReceivedListeners = headersReceivedListeners.filter(f => f !== listener);
    };

    const onHeadersReceivedAsync = (listener: HeadersReceivedListenerAsync) => {
        headersReceivedListenersAsync.push(listener);
    };

    const offHeadersReceivedAsync = (listener: HeadersReceivedListenerAsync) => {
        headersReceivedListenersAsync = headersReceivedListenersAsync.filter(f => f !== listener);
    };

    return {
        onBeforeRequest,
        offBeforeRequest,
        onBeforeSendHeaders,
        offBeforeSendHeaders,
        onBeforeSendHeadersAsync,
        offBeforeSendHeadersAsync,
        onHeadersReceived,
        offHeadersReceived,
        onHeadersReceivedAsync,
        offHeadersReceivedAsync,
    };
};
