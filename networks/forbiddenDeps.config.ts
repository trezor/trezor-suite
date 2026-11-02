import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'Network packages sit below the apps, so of the workspace scopes only @trezor/* is available to them. Take anything an app owns as an injected dependency instead.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePattern: '^@suite/', reason },
        { packageNamePattern: '^@suite-common/', reason },
        { packageNamePattern: '^@suite-native/', reason },
    ],
};
