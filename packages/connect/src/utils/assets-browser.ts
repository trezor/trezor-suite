// origin https://github.com/trezor/connect/blob/develop/src/js/env/browser/networkUtils.js

import fetch from 'cross-fetch';

export const httpRequest = async (
    url: string,
    type: 'text' | 'binary' | 'json' = 'text',
    options?: RequestInit,
) => {
    console.log('httpRequest in connect/src/utils/assets-browser');
    const init: RequestInit = { ...options, credentials: 'same-origin' };

    console.log('url', url);
    console.log('init', init);
    const response = await fetch(url, init);
    console.log('response', response);
    if (response.ok) {
        if (type === 'json') {
            const txt = await response.text();

            return JSON.parse(txt);
        }
        if (type === 'binary') {
            return response.arrayBuffer();
        }

        return response.text();
    }

    throw new Error(`httpRequest error: ${url} ${response.statusText}`);
};
