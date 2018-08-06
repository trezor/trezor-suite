/* @flow */


import 'whatwg-fetch';

export const httpRequest = async (url: string, type: string = 'text'): any => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        if (type === 'json') {
            const txt: string = await response.text();
            return JSON.parse(txt);
        } if (type === 'binary') {
            return await response.arrayBuffer();
        }
        return await response.text();
    }
    throw new Error(`${url} ${response.statusText}`);


    // return fetch(url, { credentials: 'same-origin' }).then((response) => {
    //     if (response.status === 200) {

    //         return response.text().then(result => (json ? JSON.parse(result) : result));
    //     } else {
    //         throw new Error(response.statusText);
    //     }
    // })
};

export const JSONRequest = async (url: string): Promise<JSON> => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        const txt: string = await response.text();
        return JSON.parse(txt);
    }
    throw new Error(`jsonRequest error: ${response.toString()}`);
};