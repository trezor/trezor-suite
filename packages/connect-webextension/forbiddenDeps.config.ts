import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/connect-explorer', '@trezor/webextension-mv3-sw-ts'],
        reason: 'The webextension client is restricted to Explorer and the webextension example.',
    },
};
