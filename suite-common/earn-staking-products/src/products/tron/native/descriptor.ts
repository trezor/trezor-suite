import {
    type FirmwareVersion,
    type StakingOperation,
    type StakingProductDescriptor,
    getStakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { type PartialRecord } from '@trezor/type-utils';

import { TRON_STAKING_MIN_FIRMWARE } from './constants';
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
        name: 'Tron Native Staking',
        networkSymbol,
        asset: { kind: 'native' },
        providerId: curatedProvider.id,
        type: 'native',
    } as const;

    const operations: StakingOperation[] = ['stake', 'unstake', 'withdraw', 'claim', 'vote'];

    const minFirmware = operations.reduce<PartialRecord<StakingOperation, FirmwareVersion>>(
        (record, operation) => {
            record[operation] = TRON_STAKING_MIN_FIRMWARE;

            return record;
        },
        {},
    );

    return stakingProductDescriptorSchema.parse({
        id: getStakingProductId(product),
        ...product,
        operations,
        exclusivity: 'none',
        rateKind: 'apr',
        rewardsKind: 'claimable',
        limits: TRON_NATIVE_PRODUCT_LIMITS,
        options: [{ key: 'resource', kind: 'choice' }],
        consentKey: `staking:${curatedProvider.id}`,
        platforms: {
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
        },
        messageSystemFeatures,
        minFirmware,
        isCountedInAccountTotals: true,
    });
};
