export const httpRequest = async (url: string, type = 'text'): Promise<any> => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
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
    throw new Error(`${url} ${response.statusText}`);
};
