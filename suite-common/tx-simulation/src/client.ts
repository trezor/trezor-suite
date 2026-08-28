import Blockaid from '@blockaid/client';

export const client = new Blockaid({
    baseURL: 'https://cdn.trezor.io/dynamic/blockaid/',
    apiKey: '-', // placeholder, actually handled by proxy
    // Looked up per request instead of at construction time, so importing this module never depends
    // on a global fetch already being there (jsdom test environments have none).
    fetch: (...args) => globalThis.fetch(...args),
});
