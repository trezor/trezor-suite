import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/connect-explorer'],
        reason: 'The Explorer theme is internal to Connect Explorer.',
    },
    'forbidden-in': {
        packageNamePattern: '^@trezor/network-',
        reason:
            'Network modules must receive Connect through dependency injection. ' +
            'Import contracts from @trezor/connect-common.',
    },
};
