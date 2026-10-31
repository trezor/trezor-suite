import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'The staking contracts sit below the apps and the network packages, so of the workspace scopes only @trezor/* is available to them.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePattern: '^@suite/', reason },
        { packageNamePattern: '^@suite-common/', reason },
        { packageNamePattern: '^@suite-native/', reason },
    ],
};
