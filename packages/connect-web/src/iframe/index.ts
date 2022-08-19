// origin: https://github.com/trezor/connect/blob/develop/src/js/iframe/builder.js

import { createDeferred, Deferred } from '@trezor/utils';
import { IFRAME, ERRORS, ConnectSettings } from '@trezor/connect/lib/index';
import { getOrigin } from '@trezor/connect/lib/utils/urlUtils';
import css from './inlineStyles';

/* eslint-disable import/no-mutable-exports */
export let instance: HTMLIFrameElement | null;
export let origin: string;
export let initPromise: Deferred<void> = createDeferred();
export let timeout = 0;
export let error: ERRORS.TrezorError;
/* eslint-enable import/no-mutable-exports */

let _messageID = 0;
// every postMessage to iframe has its own promise to resolve
export const messagePromises: { [key: number]: Deferred<any> } = {};

export const dispose = () => {
    if (instance && instance.parentNode) {
        try {
            instance.parentNode.removeChild(instance);
        } catch (e) {
            // do nothing
        }
    }
    instance = null;
    timeout = 0;
};

const handleIframeBlocked = () => {
    window.clearTimeout(timeout);

    error = ERRORS.TypedError('Init_IframeBlocked');
    dispose();
    initPromise.reject(error);
};

const injectStyleSheet = () => {
    if (!instance) {
        throw ERRORS.TypedError('Init_IframeBlocked');
    }
    const doc = instance.ownerDocument;
    const head = doc.head || doc.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('id', 'TrezorConnectStylesheet');

    // @ts-expect-error
    if (style.styleSheet) {
        // @ts-expect-error
        style.styleSheet.cssText = css;
        head.appendChild(style);
    } else {
        style.appendChild(document.createTextNode(css));
        head.append(style);
    }
};

export const init = async (settings: ConnectSettings) => {
    initPromise = createDeferred();
    const existedFrame = document.getElementById('trezorconnect') as HTMLIFrameElement;
    if (existedFrame) {
        instance = existedFrame;
    } else {
        instance = document.createElement('iframe');
        instance.frameBorder = '0';
        instance.width = '0px';
        instance.height = '0px';
        instance.style.position = 'absolute';
        instance.style.display = 'none';
        instance.style.border = '0px';
        instance.style.width = '0px';
        instance.style.height = '0px';
        instance.id = 'trezorconnect';
    }

    let src: string;
    if (settings.env === 'web') {
        const manifestString = settings.manifest ? JSON.stringify(settings.manifest) : 'undefined'; // note: btoa(undefined) === btoa('undefined') === "dW5kZWZpbmVk"
        const manifest = `version=${settings.version}&manifest=${encodeURIComponent(
            btoa(JSON.stringify(manifestString)),
        )}`;
        src = `${settings.iframeSrc}?${manifest}`;
    } else {
        src = settings.iframeSrc;
    }

    instance.setAttribute('src', src);
    if (settings.webusb) {
        instance.setAttribute('allow', 'usb');
    }

    origin = getOrigin(instance.src);
    timeout = window.setTimeout(() => {
        initPromise.reject(ERRORS.TypedError('Init_IframeTimeout'));
    }, 10000);

    const onLoad = () => {
        if (!instance) {
            initPromise.reject(ERRORS.TypedError('Init_IframeBlocked'));
            return;
        }
        try {
            // if hosting page is able to access cross-origin location it means that the iframe is not loaded
            const iframeOrigin = instance.contentWindow?.location.origin;
            if (!iframeOrigin || iframeOrigin === 'null') {
                handleIframeBlocked();
                return;
            }
        } catch (e) {
            // empty
        }

        let extension: string | undefined;
        if (
            typeof chrome !== 'undefined' &&
            chrome.runtime &&
            typeof chrome.runtime.onConnect !== 'undefined'
        ) {
            chrome.runtime.onConnect.addListener(() => {});
            extension = chrome.runtime.id;
        }

        instance.contentWindow?.postMessage(
            {
                type: IFRAME.INIT,
                payload: {
                    settings,
                    extension,
                },
            },
            origin,
        );

        instance.onload = null;
    };

    // IE hack
    // @ts-expect-error
    if (instance.attachEvent) {
        // @ts-expect-error
        instance.attachEvent('onload', onLoad);
    } else {
        instance.onload = onLoad;
    }
    // inject iframe into host document body
    if (document.body) {
        document.body.appendChild(instance);
        injectStyleSheet();
    }

    try {
        await initPromise.promise;
    } catch (e) {
        // reset state to allow initialization again
        if (instance) {
            if (instance.parentNode) {
                instance.parentNode.removeChild(instance);
            }
            instance = null;
        }
        throw e;
    } finally {
        window.clearTimeout(timeout);
        timeout = 0;
    }
};

// post messages to iframe
export const postMessage = (message: any, usePromise = true) => {
    if (!instance) {
        throw ERRORS.TypedError('Init_IframeBlocked');
    }
    if (usePromise) {
        _messageID++;
        message.id = _messageID;
        messagePromises[_messageID] = createDeferred();
        const { promise } = messagePromises[_messageID];
        instance.contentWindow?.postMessage(message, origin);
        return promise;
    }

    instance.contentWindow?.postMessage(message, origin);
    return null;
};

export const clearTimeout = () => {
    window.clearTimeout(timeout);
};
