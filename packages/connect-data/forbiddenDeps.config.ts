import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/connect-core', '@trezor/connect-explorer'],
        reason: 'Connect data is internal to Connect, with an exception for the Explorer coin table.',
    },
};
