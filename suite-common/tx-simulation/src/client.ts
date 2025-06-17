import Blockaid from '@blockaid/client';

export const client = new Blockaid({
    baseURL: 'https://cdn.trezor.io/dynamic/blockaid/',
    apiKey: '-', // placeholder, actually handled by proxy
});
