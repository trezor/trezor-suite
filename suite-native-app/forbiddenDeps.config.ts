import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: '^(?!@suite-native-app/)',
        reason: 'Application assembly is not reusable. Depend on @suite-native/* building blocks instead.',
    },
};
