import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { TRON_CURATED_PRODUCT_LIMITS } from './tronCuratedProductLimits';
import { curatedProvider } from '../../providers/curated';

export const TRON_CURATED_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'trx.staking.stake',
        unstake: 'trx.staking.unstake',
        withdraw: 'trx.staking.withdraw',
        claim: 'trx.staking.claim',
        vote: 'trx.staking.vote',
    };

export type CreateTronCuratedProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createTronCuratedProductDescriptor = ({
    networkSymbol,
    messageSystemFeatures,
}: CreateTronCuratedProductDescriptorParams): StakingProductDescriptor => {
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
        limits: TRON_CURATED_PRODUCT_LIMITS,
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
