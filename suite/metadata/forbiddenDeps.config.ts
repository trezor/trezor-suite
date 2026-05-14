import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageName: '@suite/suite-sync',
            reason: 'Metadata must not depend on Suite Sync. Those are parallel packages.',
        },
    ],
};
