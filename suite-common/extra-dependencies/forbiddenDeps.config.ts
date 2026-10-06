import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@trezor/suite', '@suite-native/state'],
        reason:
            'The global dependency graph may be imported only by desktop and Native application ' +
            'wiring.',
    },
};
