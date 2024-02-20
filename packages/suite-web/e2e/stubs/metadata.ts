// process of getting oauth token involves widow.open and waits for post message from it.
// Cypress can't touch other windows/tabs it so what we do here is that we replace implementation
// of window.open to invoke only postMessage with data that satisfy application flow
export const stubOpen = (win: Window) => {
    // @ts-expect-error
    win.Math.random = () => 0.4; // to make tests deterministic, this value ensures state YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

    return () =>
        win.postMessage({ search: '?code=chicken-cho-cha&state=YYYYYYYYYY', key: 'trezor-oauth' });
};

export const rerouteMetadataToMockProvider = (
    uri: string,
    options: Parameters<typeof fetch>[1],
) => {
    let url;
    try {
        url = new URL(uri);
    } catch (_err) {
        // catching absolute next.js urls which throw in URL constructor
        return fetch(uri, options);
    }

    const dropboxOrigins = ['https://content.dropboxapi.com', 'https://api.dropboxapi.com'];

    if (dropboxOrigins.some(o => uri.includes(o))) {
        return fetch(url.href.replace(url.origin, 'http://localhost:30002'), options);
    }

    const googleOrigins = ['https://www.googleapis.com', 'https://oauth2.googleapis.com'];

    if (googleOrigins.some(o => uri.includes(o))) {
        return fetch(url.href.replace(url.origin, 'http://localhost:30001'), options);
    }

    return fetch(uri, options);
};
