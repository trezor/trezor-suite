import type { connectCallableMethods } from '@trezor/connect';

// List of methods that don't work with device, so they don't need to be patched
export const blacklist: (typeof connectCallableMethods)[number][] = [
    'getSettings',
    'cardanoComposeTransaction',
    'composePsbt',
    'composeTransaction',
    'pushTransaction',
    'selectAccount',
    'solanaComposeTransaction',
    'tronComposeTransaction',
    'requestLogin',
    'getCoinInfo',
    'getAccountInfo',
    'bleUnpair',
];
