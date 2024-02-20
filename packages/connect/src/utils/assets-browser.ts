// origin https://github.com/trezor/connect/blob/develop/src/js/env/browser/networkUtils.js

import fetch from 'cross-fetch';

export const httpRequest = async (url: string, type: 'text' | 'binary' | 'json' = 'text') => {
    const response = await fetch(url, { credentials: 'same-origin' });
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
