import {
    type StakingProductDescriptor,
    type StakingProvider,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';

export type CreateCardanoEverstakeNativeProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoEverstakeNativeProductDescriptor = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateCardanoEverstakeNativeProductDescriptorParams): StakingProductDescriptor => {
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
        rewardsKind: 'claimable',
        limits: CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS,
        options: [],
        consentKey: `staking:${provider.id}`,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures,
        minFirmware: {},
        isCountedInAccountTotals: true,
    });
};
