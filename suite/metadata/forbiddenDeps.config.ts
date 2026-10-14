import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite/suite-sync$',
            reason: 'Metadata must not depend on Suite Sync. Those are parallel packages.',
        },
    ],
};
