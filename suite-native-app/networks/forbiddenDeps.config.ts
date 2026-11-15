import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@suite-native-app/state'],
        reason: 'Network modules are registered in app composition roots.',
    },
};
