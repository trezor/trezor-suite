import { z } from 'zod';

import type { NetworkSymbol } from '@trezor/network-module-types';

import { NETWORK_SYMBOL_PATTERN, networkSymbolSchema } from './primitiveSchemas';
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
            z.string().regex(STAKING_PROVIDER_ID_PATTERN),
            ':',
            stakingProductTypeSchema,
        ],
        { error: 'Expected a staking product id in the form symbol:provider:type' },
    )
    .brand<'StakingProductId'>();

export type StakingProductId = z.infer<typeof stakingProductIdSchema>;

export type StakingProductIdParts = {
    symbol: NetworkSymbol;
    providerId: StakingProviderId;
    type: StakingProductType;
};

const stakingProductIdPartsSchema = z.strictObject({
    symbol: networkSymbolSchema,
    providerId: stakingProviderIdSchema,
    type: stakingProductTypeSchema,
});

export const getStakingProductId = ({ symbol, providerId, type }: StakingProductIdParts) =>
    stakingProductIdSchema.parse(`${symbol}:${providerId}:${type}`);

export const parseStakingProductId = (value: string): StakingProductIdParts | null => {
    const result = stakingProductIdSchema.safeParse(value);

    if (!result.success) return null;

    const [symbol, providerId, type] = result.data.split(':');

    return stakingProductIdPartsSchema.parse({ symbol, providerId, type });
};
