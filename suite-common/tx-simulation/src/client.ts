import Blockaid from '@blockaid/client';

export const client = new Blockaid({
    baseURL: 'https://cdn.trezor.io/dynamic/blockaid/',
    apiKey: '-', // placeholder, actually handled by proxy
    // @blockaid/client v1.x reads a global `fetch` at construction time and throws
    // when it is missing. Defer to the runtime's `fetch` at call time so importing
    // the client never throws in environments (e.g. jsdom tests) that don't expose
    // `fetch` as a global during module evaluation.
    fetch: (input, init) => globalThis.fetch(input, init),
});
