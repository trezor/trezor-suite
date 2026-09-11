import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@suite-native/app', '@trezor/connect-explorer', 'connect-mobile-example'],
        reason: 'The mobile client is restricted to Explorer, the mobile example and Suite Native E2E tests.',
    },
    'forbidden-in': {
        packageNamePattern: '^@trezor/network-',
        reason:
            'Network modules must receive Connect through dependency injection. ' +
            'Import contracts from @trezor/connect-common.',
    },
};
