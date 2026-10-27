import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingProductDescriptor,
    asStakingAmount,
    asStakingProviderId,
    getStakingProductId,
} from '../src';

const defaults: Omit<StakingProductDescriptor, 'id'> = {
    symbol: asNetworkSymbol('eth'),
    providerId: asStakingProviderId('everstake'),
    type: 'pooled',
    operations: ['stake', 'unstake', 'withdraw'],
    exclusivity: 'none',
    rateKind: 'apy',
    limits: {
        minStakeAmount: asStakingAmount('100000000000000000'),
        maxStakeAmount: asStakingAmount('1000000000000000000000'),
        minWithdrawalAmount: asStakingAmount('30000000000000'),
        feeBufferBalance: asStakingAmount('10000000000000000'),
        minBalanceForStaking: asStakingAmount('110000000000000000'),
        minStakeAmountForDashboard: asStakingAmount('100000000000000000'),
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
