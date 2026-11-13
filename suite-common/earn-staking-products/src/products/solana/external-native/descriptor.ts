import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { SOLANA_EXTERNAL_NATIVE_PRODUCT_LIMITS } from './limits';
import { externalProvider } from '../../../providers/external';

export const createSolanaExternalNativeProductDescriptor = (
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
        rewardsKind: 'expected',
        limits: SOLANA_EXTERNAL_NATIVE_PRODUCT_LIMITS,
        options: [],
        consentKey: null,
        platforms: {
            desktop: { access: 'read-only' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures: {},
        minFirmware: {},
        // Suite shows stake delegated to other validators only as a notice, never in balances.
        isCountedInAccountTotals: false,
    });
};
