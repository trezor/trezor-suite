import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite-native-app/',
            reason: 'Native building blocks must not depend on application assembly. Pass application-specific dependencies explicitly.',
        },
    ],
};
