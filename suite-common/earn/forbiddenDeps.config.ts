import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite-common/earn-staking-products$',
            reason: 'Earn reads staking through the selectors of @suite-common/earn-staking; only the application composition roots reach the products.',
        },
    ],
};
