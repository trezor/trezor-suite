import {
    type StakingProductDescriptor,
    type StakingProvider,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS } from './limits';

export type CreateCardanoNativeDelegationProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoNativeDelegationProductDescriptor = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateCardanoNativeDelegationProductDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: provider.id,
        type: 'native',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: ['stake', 'unstake', 'claim', 'vote'],
        exclusivity: 'account',
        rateKind: 'apy',
        limits: CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS,
        options: [],
        consentKey: `staking:${provider.id}`,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures,
        isCountedInAccountTotals: true,
    });
};
