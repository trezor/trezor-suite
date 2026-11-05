import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { SOLANA_EXTERNAL_DELEGATION_PRODUCT_LIMITS } from './solanaExternalDelegationProductLimits';
import { externalProvider } from '../../../providers/external';

export const createSolanaExternalDelegationProductDescriptor = (
    networkSymbol: NetworkSymbol,
): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: externalProvider.id,
        type: 'native',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations: [],
        exclusivity: 'none',
        rateKind: 'apy',
        limits: SOLANA_EXTERNAL_DELEGATION_PRODUCT_LIMITS,
        options: [],
        consentKey: null,
        platforms: {
            desktop: { access: 'read-only' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures: {},
        // Suite shows stake delegated to other validators only as a notice, never in balances.
        isCountedInAccountTotals: false,
    });
};
