import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'Desktop and web app code may use only the layers below it: @trezor/* libraries, @suite-common/* shared logic and other @suite/* packages. Mobile app code is a sibling app layer, not a dependency.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-deps': {
        packageNamePrefixes: ['@trezor/', '@suite-common/', '@suite/'],
        reason,
    },
};
