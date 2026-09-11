import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: [],
        reason: 'Connect Explorer is an application and must not be a workspace dependency.',
    },
};
