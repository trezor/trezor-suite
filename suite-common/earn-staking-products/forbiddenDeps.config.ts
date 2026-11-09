import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite-common/earn-staking$',
            reason: 'Products implement the contracts from @suite-common/earn-staking-common and never reach the staking state or engine.',
        },
        {
            packageNamePattern: '^@suite-common/wallet-core$',
            reason: 'Products never dispatch. Everything an app owns arrives as an injected dependency.',
        },
    ],
    'allowed-only-in': {
        packages: ['@suite-app/app', '@suite-native-app/state'],
        reason: 'Only the application composition roots register staking products. Everything else reaches them through the injected product repository from @suite-common/earn-staking.',
    },
};
