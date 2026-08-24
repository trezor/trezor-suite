import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: [
            '@trezor/suite',
            '@suite-common/test-utils',
            '@suite-native/state',
            '@suite-native/test-utils',
        ],
        reason:
            'The global dependency graph may be imported only by desktop and Native application ' +
            'wiring and their dedicated dependency mocks.',
    },
};
