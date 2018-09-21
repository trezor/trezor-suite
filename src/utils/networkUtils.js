/* @flow */

import 'whatwg-fetch';

export const httpRequest = async (url: string, type: string = 'text'): any => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        if (type === 'json') {
            const txt: string = await response.text();
            return JSON.parse(txt);
        } if (type === 'binary') {
            await response.arrayBuffer();
        }
        await response.text();
    }
    throw new Error(`${url} ${response.statusText}`);
};

export const JSONRequest = async (url: string): Promise<JSON> => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        const txt: string = await response.text();
        return JSON.parse(txt);
    }
    throw new Error(`jsonRequest error: ${response.toString()}`);
};