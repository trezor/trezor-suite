import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { ETHEREUM_EVERSTAKE_POOLED_PRODUCT_LIMITS } from './limits';
import { ETHEREUM_EVERSTAKE_POOLED_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './messageSystemFeatures';
import { everstakeProvider } from '../../../providers/everstake';

export const createEthereumEverstakePooledProductDescriptor = (
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
        limits: ETHEREUM_EVERSTAKE_POOLED_PRODUCT_LIMITS,
        options: [{ key: 'instant', kind: 'boolean' }],
        consentKey: 'staking:everstake',
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'manage' },
        },
        messageSystemFeatures:
            // Hoodi has no message system gating
            networkSymbol === 'eth'
                ? ETHEREUM_EVERSTAKE_POOLED_PRODUCT_MESSAGE_SYSTEM_FEATURES
                : {},
        isCountedInAccountTotals: true,
    });
};
