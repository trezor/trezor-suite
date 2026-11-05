import {
    type StakingProductDescriptor,
    type StakingProvider,
    getStakingProductId,
    stakingProductDescriptorSchema,
    stakingProductLimitsSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { externalProvider } from '../providers/external';

// Copied from @trezor/network-solana constants/staking.ts in lamports, so the staking
// packages own every staking value; the originals stay until the legacy cleanup.
export const SOLANA_NATIVE_DELEGATION_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '1000000000',
    maxStakeAmount: '10000000000000000',
    minWithdrawalAmount: '20000000',
    feeBufferBalance: '5000000',
    minBalanceForStaking: '1020000000',
    minStakeAmountForDashboard: '1000000000',
});

const NO_STAKING_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '0',
    maxStakeAmount: '0',
    minWithdrawalAmount: '0',
    feeBufferBalance: '0',
    minBalanceForStaking: '0',
    minStakeAmountForDashboard: '0',
});

export const EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'sol.staking.stake',
        unstake: 'sol.staking.unstake',
        withdraw: 'sol.staking.claim',
    };

export type CreateSolanaNativeDelegationDescriptorParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createSolanaNativeDelegationDescriptor = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateSolanaNativeDelegationDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: provider.id,
        type: 'native',
    } as const;

    const id = getStakingProductId(product);

    return stakingProductDescriptorSchema.parse({
        id,
        ...product,
        operations: ['stake', 'unstake', 'withdraw'],
        exclusivity: 'none',
        rateKind: 'apy',
        limits: SOLANA_NATIVE_DELEGATION_LIMITS,
        options: [],
        consentKey: `staking:${provider.id}`,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'manage' },
        },
        messageSystemFeatures,
        isCountedInAccountTotals: true,
    });
};

export const createSolanaExternalDelegationDescriptor = (
    networkSymbol: NetworkSymbol,
): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: externalProvider.id,
        type: 'native',
    } as const;

    const id = getStakingProductId(product);

    return stakingProductDescriptorSchema.parse({
        id,
        ...product,
        operations: [],
        exclusivity: 'none',
        rateKind: 'apy',
        limits: NO_STAKING_LIMITS,
        options: [],
        consentKey: null,
        platforms: {
            desktop: { access: 'read-only' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures: {},
        // Suite shows stake delegated to other validators only as a notice, never in balances.
        isCountedInAccountTotals: false,
    });
};
