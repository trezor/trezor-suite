import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { EVERSTAKE_POOLED_PRODUCT_LIMITS } from './everstakePooledProductLimits';
import { EVERSTAKE_ETHEREUM_MESSAGE_SYSTEM_FEATURES } from './everstakePooledProductMessageSystemFeatures';
import { everstakeProvider } from '../../providers/everstake';

export const createEverstakePooledProductDescriptor = (
    networkSymbol: NetworkSymbol,
): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: everstakeProvider.id,
        type: 'pooled',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: ['stake', 'unstake', 'withdraw'],
        exclusivity: 'none',
        rateKind: 'apy',
        limits: EVERSTAKE_POOLED_PRODUCT_LIMITS,
        options: [{ key: 'instant', kind: 'boolean' }],
        consentKey: 'staking:everstake',
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'manage' },
        },
        messageSystemFeatures:
            // Hoodi has no message system gating
            networkSymbol === 'eth' ? EVERSTAKE_ETHEREUM_MESSAGE_SYSTEM_FEATURES : {},
        isCountedInAccountTotals: true,
    });
};
