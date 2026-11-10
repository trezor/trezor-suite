import {
    type StakingProductDescriptor,
    type StakingProvider,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS } from './limits';

export type CreateSolanaNativeDelegationProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createSolanaNativeDelegationProductDescriptor = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateSolanaNativeDelegationProductDescriptorParams): StakingProductDescriptor => {
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
        limits: SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS,
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
