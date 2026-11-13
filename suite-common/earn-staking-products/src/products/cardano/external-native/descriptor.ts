import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { CARDANO_EXTERNAL_NATIVE_PRODUCT_LIMITS } from './limits';
import { externalProvider } from '../../../providers/external';

export type CreateCardanoExternalNativeProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoExternalNativeProductDescriptor = ({
    networkSymbol,
    messageSystemFeatures,
}: CreateCardanoExternalNativeProductDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: externalProvider.id,
        type: 'native',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: ['unstake', 'claim', 'vote'],
        exclusivity: 'account',
        rateKind: 'apy',
        limits: CARDANO_EXTERNAL_NATIVE_PRODUCT_LIMITS,
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
