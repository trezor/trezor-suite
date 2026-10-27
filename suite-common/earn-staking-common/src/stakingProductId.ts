import { z } from 'zod';

import type { NetworkSymbol } from '@trezor/network-module-types';

import { networkSymbolSchema } from './primitiveSchemas';
import { type StakingProviderId, stakingProviderIdSchema } from './stakingProvider';

export const STAKING_PRODUCT_TYPES = ['native', 'pooled', 'liquid'] as const;

export const stakingProductTypeSchema = z.enum(STAKING_PRODUCT_TYPES);

export type StakingProductType = z.infer<typeof stakingProductTypeSchema>;

export type StakingProductIdParts = {
    symbol: NetworkSymbol;
    providerId: StakingProviderId;
    type: StakingProductType;
};

const stakingProductIdPartsSchema = z.object({
    symbol: networkSymbolSchema,
    providerId: stakingProviderIdSchema,
    type: stakingProductTypeSchema,
});

export const parseStakingProductId = (value: string): StakingProductIdParts | null => {
    const [symbol, providerId, type, ...rest] = value.split(':');

    if (rest.length > 0) return null;

    const result = stakingProductIdPartsSchema.safeParse({ symbol, providerId, type });

    return result.success ? result.data : null;
};

export const stakingProductIdSchema = z
    .string()
    .refine(
        value => parseStakingProductId(value) !== null,
        'Expected a staking product id in the form symbol:provider:type',
    )
    .brand<'StakingProductId'>();

export type StakingProductId = z.infer<typeof stakingProductIdSchema>;

export const getStakingProductId = ({ symbol, providerId, type }: StakingProductIdParts) =>
    `${symbol}:${providerId}:${type}` as StakingProductId;
