import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'Network packages sit below the apps, so of the workspace scopes only @trezor/* is available to them. Take anything an app owns as an injected dependency instead.';

// TODO(#32493): the last app-scoped dependency under networks/. `calldata` is a @trezor/*-level
// library sitting in the wrong folder.
const exempt = ['@suite-common/calldata'];

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePrefix: '@suite/', reason },
        { packageNamePrefix: '@suite-common/', except: exempt, reason },
        { packageNamePrefix: '@suite-native/', reason },
    ],
};
