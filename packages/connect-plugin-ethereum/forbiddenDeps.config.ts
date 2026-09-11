import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: [],
        reason: 'The deprecated Ethereum plugin must not be a workspace dependency.',
    },
};
