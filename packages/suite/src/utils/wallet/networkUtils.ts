// TODO: do we need this?
// import 'whatwg-fetch';

export const httpRequest = async (url: string, type: string = 'text'): Promise<any> => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        if (type === 'json') {
            const txt = await response.text();
            return JSON.parse(txt);
        }
        if (type === 'binary') {
            await response.arrayBuffer();
        }
        await response.text();
    }
    throw new Error(`${url} ${response.statusText}`);
};
