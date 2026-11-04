import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
    stakingProductLimitsSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import { everstakeProvider } from '../providers/everstake';

// Copied from wallet-core's ethereumStakingConstants.ts and wallet-constants, in wei, so the
// staking packages own every staking value; the originals stay until the legacy cleanup.
export const EVERSTAKE_POOLED_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '10000000000000000',
    maxStakeAmount: '1000000000000000000000000',
    minWithdrawalAmount: '5000000000000000',
    feeBufferBalance: '5000000000000000',
    minBalanceForStaking: '15000000000000000',
    minStakeAmountForDashboard: '10000000000000000',
});

// The message system has no Hoodi keys, so only mainnet operations can be switched off remotely.
const MESSAGE_SYSTEM_FEATURES_BY_SYMBOL: Partial<
    Record<NetworkSymbol, StakingProductDescriptor['messageSystemFeatures']>
> = {
    [asNetworkSymbol('eth')]: {
        stake: 'eth.staking.stake',
        unstake: 'eth.staking.unstake',
        withdraw: 'eth.staking.claim',
    },
};

export const createEverstakePooledDescriptor = (
    networkSymbol: NetworkSymbol,
): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: everstakeProvider.id,
        type: 'pooled',
    } as const;

    const id = getStakingProductId(product);

    return stakingProductDescriptorSchema.parse({
        id,
        ...product,
        operations: ['stake', 'unstake', 'withdraw'],
        exclusivity: 'none',
        rateKind: 'apy',
        limits: EVERSTAKE_POOLED_LIMITS,
        options: [{ key: 'instant', kind: 'boolean' }],
        consentKey: 'staking:everstake',
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'manage' },
        },
        messageSystemFeatures: MESSAGE_SYSTEM_FEATURES_BY_SYMBOL[networkSymbol] ?? {},
    });
};
