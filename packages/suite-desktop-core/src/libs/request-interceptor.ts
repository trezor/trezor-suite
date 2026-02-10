import { session } from 'electron';

/**
 * Should be used for all webRequest.on* events as there can be only
 * one listener for each of them, but sometimes we need to bind more
 * of them.
 */
export const createInterceptor = (): RequestInterceptor => {
    let beforeRequestListeners: BeforeRequestListener[] = [];
    const filter = { urls: ['*://*/*'] };

    const handleRequest = (
        details: Electron.OnBeforeRequestListenerDetails,
        callback: (response: Electron.CallbackResponse) => void,
    ) => {
        for (let i = 0; i < beforeRequestListeners.length; ++i) {
            const res = beforeRequestListeners[i](details);
            if (res) {
                callback(res);

                return;
            }
        }
        callback({ cancel: false });
    };

    // Adds listener for electron-updater session.
    const updaterSession = session.fromPartition('electron-updater');
    updaterSession.webRequest.onBeforeRequest(filter, handleRequest);

    // Adds listener for electron default session.
    session.defaultSession.webRequest.onBeforeRequest(filter, handleRequest);
    
    // session.fromPartition('webview').resolveProxy('https://www.trezor.io').then((proxyUrl) => {
    //     console.log('proxyUrl', proxyUrl);

    //     // DIRECT means no proxy is configured
    //     if (proxyUrl !== 'DIRECT') {
    //         // retrieve the parts of the proxy from the string returned
    //         // the url would look something like: 'PROXY http-proxy.mydomain.com:8080'
    //         const proxyUrlComponents = proxyUrl.split(':');

    //         const proxyHost = proxyUrlComponents[0].split(' ')[1];
    //         console.log('proxyHost', proxyHost);
    //         const proxyPort = parseInt(proxyUrlComponents[1], 10);
    //         console.log('proxyPort', proxyPort);

    //         // do something with proxy details
    //     }
    // });

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
