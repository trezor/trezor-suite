import {
    type StakingProductDescriptor,
    type StakingProvider,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';

export type CreateSolanaEverstakeNativeProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createSolanaEverstakeNativeProductDescriptor = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateSolanaEverstakeNativeProductDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: provider.id,
        type: 'native',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: ['stake', 'unstake', 'withdraw'],
        exclusivity: 'none',
        rateKind: 'apy',
        rewardsKind: 'expected',
        limits: SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS,
        options: [],
        consentKey: `staking:${provider.id}`,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'manage' },
        },
        messageSystemFeatures,
        minFirmware: {},
        isCountedInAccountTotals: true,
    });
};
