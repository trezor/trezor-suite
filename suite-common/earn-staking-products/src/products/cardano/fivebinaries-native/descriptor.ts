import {
    type StakingProductDescriptor,
    type StakingProvider,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { CARDANO_FIVEBINARIES_NATIVE_PRODUCT_LIMITS } from './limits';

export type CreateCardanoFivebinariesNativeProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoFivebinariesNativeProductDescriptor = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateCardanoFivebinariesNativeProductDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: provider.id,
        type: 'native',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: ['unstake', 'claim', 'vote'],
        exclusivity: 'account',
        rateKind: 'apy',
        limits: CARDANO_FIVEBINARIES_NATIVE_PRODUCT_LIMITS,
        options: [],
        consentKey: null,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures,
        isCountedInAccountTotals: true,
    });
};
