import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import { EVERSTAKE_POOLED_PRODUCT_LIMITS } from './everstakePooledProductLimits';
import { everstakeProvider } from '../../providers/everstake';

// The message system has no Hoodi keys, so only mainnet operations can be switched off remotely.
const MESSAGE_SYSTEM_FEATURES_BY_SYMBOL: Partial<
    Record<NetworkSymbol, StakingProductDescriptor['messageSystemFeatures']>
> = {
    [asNetworkSymbol('eth')]: {
        stake: 'eth.staking.stake',
        unstake: 'eth.staking.unstake',
        withdraw: 'eth.staking.claim',
    },
};

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
        messageSystemFeatures: MESSAGE_SYSTEM_FEATURES_BY_SYMBOL[networkSymbol] ?? {},
    });
};
