import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/connect-explorer', '@trezor/connect-webextension', '@trezor/suite-e2e'],
        reason: 'The web client is restricted to Explorer, webextension implementation reuse and Suite E2E tests.',
    },
    'forbidden-in': {
        packageNamePattern: '^@trezor/network-',
        reason:
            'Network modules must receive Connect through dependency injection. ' +
            'Import contracts from @trezor/connect-common.',
    },
};
