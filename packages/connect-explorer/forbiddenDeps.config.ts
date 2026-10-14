import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@trezor/network-.+-suite(?:-.+)?$',
            reason: 'Connect Explorer must remain independent of Suite network modules.',
        },
    ],
    'allowed-only-in': {
        packages: [],
        reason: 'Connect Explorer is an application and must not be a workspace dependency.',
    },
};
