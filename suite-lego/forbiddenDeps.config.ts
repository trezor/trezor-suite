import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason = 'Generic desktop/web building blocks cannot import application packages.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePattern: '^@suite/', reason },
        { packageNamePattern: '^@suite-native/', reason },
        { packageNamePattern: '^@suite-cli/', reason },
    ],
};
