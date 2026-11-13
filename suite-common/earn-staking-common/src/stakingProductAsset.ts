import type { NetworkSymbol } from '@trezor/network-module-types';
import { z } from '@trezor/zod';

export const STAKING_ASSET_SYMBOL_PATTERN = /^[a-z0-9][a-z0-9.-]*$/;

export const stakingAssetSymbolSchema = z
    .string()
    .regex(STAKING_ASSET_SYMBOL_PATTERN, 'Expected a lowercase asset symbol')
    .brand<'StakingAssetSymbol'>();

export type StakingAssetSymbol = z.infer<typeof stakingAssetSymbolSchema>;

export const STAKING_PRODUCT_ASSET_KINDS = ['native', 'token'] as const;

export const stakingProductAssetSchema = z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('native') }),
    z.strictObject({
        kind: z.literal('token'),
        symbol: stakingAssetSymbolSchema,
        contract: z.string().min(1),
    }),
]);

export type StakingProductAsset = z.infer<typeof stakingProductAssetSchema>;

export type StakingProductAssetParams = {
    networkSymbol: NetworkSymbol;
    asset: StakingProductAsset;
};

export const getStakingAssetSymbol = ({ networkSymbol, asset }: StakingProductAssetParams) =>
    asset.kind === 'native' ? stakingAssetSymbolSchema.parse(networkSymbol) : asset.symbol;
