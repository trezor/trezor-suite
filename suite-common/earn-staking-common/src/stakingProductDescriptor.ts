import { z } from 'zod';

import { typedObjectKeys } from '@trezor/utils';

import { firmwareVersionSchema, networkSymbolSchema } from './primitiveSchemas';
import { stakingAmountSchema } from './stakingAmount';
import { stakingOperationSchema } from './stakingOperation';
import { stakingProductPlatformsSchema } from './stakingPlatform';
import { stakingProductAssetSchema } from './stakingProductAsset';
import { stakingProductIdSchema, stakingProductTypeSchema } from './stakingProductId';
import { stakingProviderIdSchema } from './stakingProvider';

export const stakingProductLimitsSchema = z.strictObject({
    minStakeAmount: stakingAmountSchema,
    maxStakeAmount: stakingAmountSchema,
    minWithdrawalAmount: stakingAmountSchema,
    feeBufferBalance: stakingAmountSchema,
    minBalanceForStaking: stakingAmountSchema,
    minStakeAmountForDashboard: stakingAmountSchema,
    registrationDeposit: stakingAmountSchema,
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

/**
 * `compounded`: rewards are restaked into `balances.staked`. `claimable`: rewards accrue apart
 * from the stake and are paid out by `claim`. `expected`: rewards are an estimate, since the
 * chain pays them into the stake without reporting them.
 */
export const STAKING_REWARDS_KINDS = ['compounded', 'claimable', 'expected'] as const;

export const stakingRewardsKindSchema = z.enum(STAKING_REWARDS_KINDS);

export type StakingRewardsKind = z.infer<typeof stakingRewardsKindSchema>;

export const stakingProductDescriptorObjectSchema = z.strictObject({
    id: stakingProductIdSchema,
    networkSymbol: networkSymbolSchema,
    asset: stakingProductAssetSchema,
    providerId: stakingProviderIdSchema,
    type: stakingProductTypeSchema,
    operations: z.array(stakingOperationSchema).readonly(),
    exclusivity: z.enum(STAKING_PRODUCT_EXCLUSIVITIES),
    rateKind: z.enum(STAKING_RATE_KINDS),
    rewardsKind: stakingRewardsKindSchema,
    limits: stakingProductLimitsSchema,
    options: z.array(stakingOptionFieldSchema).readonly(),
    consentKey: stakingConsentKeySchema.nullable(),
    platforms: stakingProductPlatformsSchema,
    messageSystemFeatures: z.partialRecord(stakingOperationSchema, z.string()),
    minFirmware: z.partialRecord(stakingOperationSchema, firmwareVersionSchema),
    isCountedInAccountTotals: z.boolean(),
});

export const stakingProductDescriptorSchema = stakingProductDescriptorObjectSchema
    .refine(
        ({ id, networkSymbol, asset, providerId, type }) =>
            id ===
            `${networkSymbol}:${asset.kind === 'native' ? networkSymbol : asset.symbol}:${providerId}:${type}`,
        {
            error: 'Expected the product id to match the network symbol, asset, provider and type',
            path: ['id'],
        },
    )
    .refine(
        ({ operations, consentKey }) =>
            !operations.some(operation => operation === 'stake' || operation === 'redelegate') ||
            consentKey !== null,
        {
            error: 'Expected a consent key on a product that stakes or redelegates',
            path: ['consentKey'],
        },
    )
    .refine(
        ({ operations, platforms }) =>
            Object.values(platforms).every(
                support =>
                    support.access !== 'manage' ||
                    (support.operations ?? []).every(operation => operations.includes(operation)),
            ),
        {
            error: 'Expected the platform operations to be a subset of the product operations',
            path: ['platforms'],
        },
    )
    .refine(
        ({ operations, minFirmware }) =>
            typedObjectKeys(minFirmware).every(operation => operations.includes(operation)),
        {
            error: 'Expected a minimum firmware only for operations the product offers',
            path: ['minFirmware'],
        },
    );

export type StakingProductDescriptor = z.infer<typeof stakingProductDescriptorSchema>;
