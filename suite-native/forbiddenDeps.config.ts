import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'Mobile app code may use only the layers below it: @trezor/* libraries, @suite-common/* shared logic and other @suite-native/* packages. Desktop and web app code is a sibling app layer, not a dependency.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-deps': {
        packageNamePrefixes: ['@trezor/', '@suite-common/', '@suite-native/'],
        reason,
    },
    // packages/suite* hosts the web/desktop app despite sitting in the @trezor/* scope.
    'forbidden-deps': [{ packageNamePrefix: '@trezor/suite', reason }],
};
