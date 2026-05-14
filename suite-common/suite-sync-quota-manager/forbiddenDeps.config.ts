import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        // Todo: Remove this temporary violation after https://github.com/trezor/trezor-suite/pull/25540 is fully addressed.
        // {
        //     packageName: '@suite-common/suite-sync-types',
        //     reason: 'Quota Manager is dependency of the Suite Sync, not the other way around.',
        // },
        {
            packageName: '@suite-common/suite-sync',
            reason: 'Quota Manager is dependency of the Suite Sync, not the other way around.',
        },
    ],
};
