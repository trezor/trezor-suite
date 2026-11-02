import { z } from 'zod';

import { networkSymbolSchema } from './primitiveSchemas';
import { stakingAmountSchema } from './stakingAmount';
import { stakingOperationSchema } from './stakingOperation';
import { stakingProductPlatformsSchema } from './stakingPlatform';
import { stakingProductIdSchema, stakingProductTypeSchema } from './stakingProductId';
import { stakingProviderIdSchema } from './stakingProvider';

export const stakingProductLimitsSchema = z.strictObject({
    minStakeAmount: stakingAmountSchema,
    maxStakeAmount: stakingAmountSchema,
    minWithdrawalAmount: stakingAmountSchema,
    feeBufferBalance: stakingAmountSchema,
    minBalanceForStaking: stakingAmountSchema,
    minStakeAmountForDashboard: stakingAmountSchema,
});

export type StakingProductLimits = z.infer<typeof stakingProductLimitsSchema>;

export const STAKING_OPTION_KINDS = ['boolean', 'choice', 'allocation'] as const;

export const stakingOptionFieldSchema = z.strictObject({
    key: z.string().min(1),
    kind: z.enum(STAKING_OPTION_KINDS),
});

export type StakingOptionField = z.infer<typeof stakingOptionFieldSchema>;

export const stakingConsentKeySchema = z.templateLiteral(['staking:', z.string()]);

export type StakingConsentKey = z.infer<typeof stakingConsentKeySchema>;

export const STAKING_PRODUCT_EXCLUSIVITIES = ['none', 'account'] as const;

export const STAKING_RATE_KINDS = ['apy', 'apr'] as const;

export const stakingProductDescriptorObjectSchema = z.strictObject({
    id: stakingProductIdSchema,
    symbol: networkSymbolSchema,
    providerId: stakingProviderIdSchema,
    type: stakingProductTypeSchema,
    operations: z.array(stakingOperationSchema).readonly(),
    exclusivity: z.enum(STAKING_PRODUCT_EXCLUSIVITIES),
    rateKind: z.enum(STAKING_RATE_KINDS),
    limits: stakingProductLimitsSchema,
    options: z.array(stakingOptionFieldSchema).readonly(),
    consentKey: stakingConsentKeySchema,
    platforms: stakingProductPlatformsSchema,
    messageSystemFeatures: z.partialRecord(stakingOperationSchema, z.string()),
});

export const stakingProductDescriptorSchema = stakingProductDescriptorObjectSchema.refine(
    ({ id, symbol, providerId, type }) => id === `${symbol}:${providerId}:${type}`,
    {
        error: 'Expected the product id to match the symbol, provider and type',
        path: ['id'],
    },
);

export type StakingProductDescriptor = z.infer<typeof stakingProductDescriptorSchema>;
