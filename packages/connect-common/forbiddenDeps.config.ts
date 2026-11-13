import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@trezor/blockchain-link$',
            reason: 'Blockchain backends live in @trezor/blockchain-core, next to Connect.',
        },
    ],
};
