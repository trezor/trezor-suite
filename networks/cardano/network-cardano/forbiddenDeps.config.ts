import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        '@trezor/connect',
        '@trezor/connect-web',
        '@trezor/connect-mobile',
        '@trezor/connect-webextension',
        '@trezor/connect-electron',
    ].map(packageName => ({
        packageName,
        reason:
            'Network modules must receive Connect through dependency injection. ' +
            'Import contracts from @trezor/connect-common.',
    })),
};
