import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: [
            '@suite/suite-sync',
            '@suite-native/suite-sync',
            '@suite-common/e2e-evolu-client',
            '@trezor/suite-e2e',
        ],
        reason:
            'We do not want to depend on Evolu, so we have ' +
            'abstraction for it, and Evolu must be only ' +
            'injected in the entry-points.',
    },
};
