import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { TRON_NATIVE_PRODUCT_LIMITS } from './limits';
import { curatedProvider } from '../../../providers/curated';

export type CreateTronNativeProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createTronNativeProductDescriptor = ({
    networkSymbol,
    messageSystemFeatures,
}: CreateTronNativeProductDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: curatedProvider.id,
        type: 'native',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
        exclusivity: 'none',
        rateKind: 'apr',
        limits: TRON_NATIVE_PRODUCT_LIMITS,
        options: [{ key: 'resource', kind: 'choice' }],
        consentKey: `staking:${curatedProvider.id}`,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures,
        isCountedInAccountTotals: true,
    });
};
