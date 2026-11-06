import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite/metadata$',
            reason: 'Suite Sync must not depend on Metadata. Those are parallel packages.',
        },
    ],
};
