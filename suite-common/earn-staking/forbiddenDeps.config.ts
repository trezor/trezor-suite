import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite-common/earn-staking-products$',
            reason: 'The staking core reaches products only through the product repository, which the application composition roots fill.',
        },
    ],
};
