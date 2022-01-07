import { TOR_URLS } from '@suite-constants/tor';

export const PROTOCOL = 'file';

// HTTP server default origins
export const HTTP_ORIGINS_DEFAULT = [
    '127.0.0.1',
    'localhost',
    'trezor.io',
    '*.trezor.io',
    '*.sldev.cz',
    TOR_URLS['trezor.io'],
    `*.${TOR_URLS['trezor.io']}`,
];
