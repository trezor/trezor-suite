import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@suite-native-app/state', '@suite-native-app/module-sign-verify'],
        reason: 'This registers the mobile network modules, used only by app code.',
    },
};
