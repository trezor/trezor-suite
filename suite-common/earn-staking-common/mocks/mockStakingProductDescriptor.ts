import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '../src';

const defaults: Omit<StakingProductDescriptor, 'id'> = {
    symbol: asNetworkSymbol('eth'),
    providerId: stakingProviderIdSchema.parse('everstake'),
    type: 'pooled',
    operations: ['stake', 'unstake', 'withdraw'],
    exclusivity: 'none',
    rateKind: 'apy',
    limits: {
        minStakeAmount: stakingAmountSchema.parse('100000000000000000'),
        maxStakeAmount: stakingAmountSchema.parse('1000000000000000000000'),
        minWithdrawalAmount: stakingAmountSchema.parse('30000000000000'),
        feeBufferBalance: stakingAmountSchema.parse('10000000000000000'),
        minBalanceForStaking: stakingAmountSchema.parse('110000000000000000'),
        minStakeAmountForDashboard: stakingAmountSchema.parse('100000000000000000'),
    },
    options: [{ key: 'instant', kind: 'boolean' }],
    consentKey: 'staking:everstake',
    platforms: {
        desktop: { access: 'manage' },
        mobile: { access: 'manage' },
    },
    messageSystemFeatures: {
        stake: 'eth.staking.stake',
        unstake: 'eth.staking.unstake',
        withdraw: 'eth.staking.claim',
    },
};

export const mockStakingProductDescriptor = (
    overrides: Partial<StakingProductDescriptor> = {},
): StakingProductDescriptor => {
    const descriptor = { ...defaults, ...overrides };

    return { ...descriptor, id: overrides.id ?? getStakingProductId(descriptor) };
};
