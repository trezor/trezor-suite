import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: '^(?!@suite-app/)',
        reason: 'Application assembly is not reusable. Depend on @suite/* building blocks instead.',
    },
};
