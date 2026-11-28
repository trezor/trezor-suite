import {
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { createEthereumLidoLiquidProductLimits } from './limits';
import { lidoProvider } from '../../../providers/lido';

export type CreateEthereumLidoLiquidProductDescriptorParams = {
    networkSymbol: NetworkSymbol;
};

export const createEthereumLidoLiquidProductDescriptor = ({
    networkSymbol,
}: CreateEthereumLidoLiquidProductDescriptorParams): StakingProductDescriptor => {
    const product = {
        networkSymbol,
        asset: { kind: 'native' },
        providerId: lidoProvider.id,
        type: 'liquid',
    } as const;

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        name: 'Lido Liquid Staking',
        operations: ['stake', 'unstake', 'withdraw'],
        exclusivity: 'none',
        rateKind: 'apr',
        // WstETH gains value against ETH; the chain reports no reward amount.
        rewardsKind: 'expected',
        limits: createEthereumLidoLiquidProductLimits(),
        options: [],
        consentKey: 'staking:lido',
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures: {},
        minFirmware: {},
        // The account already counts wstETH among its tokens, and the screens of an account read
        // its one counted position, which is the Everstake pool's.
        isCountedInAccountTotals: false,
    });
};
