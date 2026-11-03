import { z } from 'zod';

import type { NetworkSymbol } from '@trezor/network-module-types';

import { NETWORK_SYMBOL_PATTERN, networkSymbolSchema } from './primitiveSchemas';
import {
    STAKING_ASSET_SYMBOL_PATTERN,
    type StakingAssetSymbol,
    type StakingProductAsset,
    getStakingAssetSymbol,
    stakingAssetSymbolSchema,
} from './stakingProductAsset';
import {
    STAKING_PROVIDER_ID_PATTERN,
    type StakingProviderId,
    stakingProviderIdSchema,
} from './stakingProvider';

export const STAKING_PRODUCT_TYPES = ['native', 'pooled', 'liquid'] as const;

export const stakingProductTypeSchema = z.enum(STAKING_PRODUCT_TYPES);

export type StakingProductType = z.infer<typeof stakingProductTypeSchema>;

export const stakingProductIdSchema = z
    .templateLiteral(
        [
            z.string().regex(NETWORK_SYMBOL_PATTERN),
            ':',
            z.string().regex(STAKING_ASSET_SYMBOL_PATTERN),
            ':',
            z.string().regex(STAKING_PROVIDER_ID_PATTERN),
            ':',
            stakingProductTypeSchema,
        ],
        { error: 'Expected a staking product id in the form symbol:asset:provider:type' },
    )
    .brand<'StakingProductId'>();

export type StakingProductId = z.infer<typeof stakingProductIdSchema>;

export type StakingProductIdInput = {
    networkSymbol: NetworkSymbol;
    asset: StakingProductAsset;
    providerId: StakingProviderId;
    type: StakingProductType;
};

export type StakingProductIdParts = {
    networkSymbol: NetworkSymbol;
    assetSymbol: StakingAssetSymbol;
    providerId: StakingProviderId;
    type: StakingProductType;
};

const stakingProductIdPartsSchema = z.strictObject({
    networkSymbol: networkSymbolSchema,
    assetSymbol: stakingAssetSymbolSchema,
    providerId: stakingProviderIdSchema,
    type: stakingProductTypeSchema,
});

export const getStakingProductId = ({
    networkSymbol,
    asset,
    providerId,
    type,
}: StakingProductIdInput) =>
    stakingProductIdSchema.parse(
        `${networkSymbol}:${getStakingAssetSymbol({ networkSymbol, asset })}:${providerId}:${type}`,
    );

export const parseStakingProductId = (value: string): StakingProductIdParts | null => {
    const result = stakingProductIdSchema.safeParse(value);

    if (!result.success) return null;

    const [networkSymbol, assetSymbol, providerId, type] = result.data.split(':');

    return stakingProductIdPartsSchema.parse({ networkSymbol, assetSymbol, providerId, type });
};
