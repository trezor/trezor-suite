import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: '^@trezor/network-',
        reason:
            'Network modules must receive Connect through dependency injection. ' +
            'Import contracts from @trezor/connect-common.',
    },
};
