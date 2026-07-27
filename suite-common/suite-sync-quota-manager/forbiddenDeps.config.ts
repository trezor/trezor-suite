import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageName: '@suite-common/suite-sync',
            // But `@suite-common/suite-sync-storage` is ok, as we need Owner from it.
            // More correct would be, however, to split Owner to own package (`@suite-common/suite-sync-owner`)
            reason: 'Quota Manager is dependency of the Suite Sync, not the other way around.',
        },
    ],
};
