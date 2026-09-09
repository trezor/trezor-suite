import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@trezor/connect(?!-common$)',
            reason:
                'Network modules must receive Connect through dependency injection. ' +
                'Import contracts from @trezor/connect-common.',
        },
    ],
};
