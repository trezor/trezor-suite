import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/connect-explorer'],
        reason: 'The Explorer theme is internal to Connect Explorer.',
    },
};
