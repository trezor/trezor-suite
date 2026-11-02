import { parseJSON } from '@trezor/utils';

/**
 * What a page posted, as the log shows it. The `window.ReactNativeWebView.postMessage` shim turns
 * everything into a string, but on iOS a page may call the WebKit handler underneath it,
 * `window.webkit.messageHandlers.ReactNativeWebView.postMessage`, with any value, and that value
 * arrives as it is. A string holding JSON is logged by the parsed value, as the web host logs a
 * structured-cloned message, any other string as it was sent, and a non-string as it arrived.
 */
export const parseMessageData = (data: unknown): unknown => {
    if (typeof data !== 'string') {
        return data;
    }

    const parsedData = parseJSON(data);

    return parsedData === undefined ? data : parsedData;
};
