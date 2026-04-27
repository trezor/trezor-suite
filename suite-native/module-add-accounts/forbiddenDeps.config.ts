import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    // Todo: Revisit this restriction after https://github.com/trezor/trezor-suite/issues/27205 is resolved.
    // 'allowed-only-in': {
    //     packages: ['@suite-native/app'],
    //     reason: 'This is top-level app module not intended to be reused.',
    // },
};
