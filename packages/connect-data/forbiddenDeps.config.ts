import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/blockchain-core', '@trezor/connect-core', '@trezor/connect-explorer'],
        reason: 'Connect data is internal to Connect and its blockchain backends, with an exception for the Explorer coin table.',
    },
};
