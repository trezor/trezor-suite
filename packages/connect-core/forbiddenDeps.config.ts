import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@trezor/blockchain-link$',
            reason: 'Blockchain backends live in @trezor/blockchain-core, next to Connect.',
        },
    ],
    'forbidden-in': {
        packageNamePattern: '^@trezor/network-',
        reason:
            'Network modules must receive Connect through dependency injection. ' +
            'Import contracts from @trezor/connect-common.',
    },
};
