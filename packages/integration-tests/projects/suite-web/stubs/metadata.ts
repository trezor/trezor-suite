
// redirect any request to googleapis to custom google mock server running on localhost
export const stubFetch = (uri: string, options: Parameters<typeof fetch>[1]) => {
    const url = new URL(uri);
    const origins = ['https://www.googleapis.com', 'https://oauth2.googleapis.com'];

    if (origins.some(o => uri.includes(o))) {
        return fetch(url.href.replace(url.origin, 'http://localhost:30001'), options)
    }
    return fetch(uri, options);
}

// process of getting oauth token involves widow.open and waits for post message from it.
// Cypress can't touch other windows/tabs it so what we do here is that we replace implementation
// of window.open to invoke only postMessage with data that satisfy application flow
export const stubOpen = (win: Window) => {
    // @ts-ignore
    win.Math.random = () => 0.4; // to make tests deterministic, this value ensures state YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
    // @ts-ignore
    return () => win.postMessage('#access_token=chicken-cho-cha&token_type=bearer&state=YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
}
