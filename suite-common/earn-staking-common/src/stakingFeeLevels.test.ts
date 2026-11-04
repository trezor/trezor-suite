import type { FeeLevel } from '@trezor/connect-common';

import {
    STAKING_FEE_LEVEL_LABELS,
    type StakingFeeLevelLabel,
    stakingCustomFeeSchema,
    stakingFeeLevelSchema,
    stakingFeeLevelsSchema,
} from './stakingFeeLevels';
import { mockStakingErrorFeeLevel, mockStakingFeeLevels, mockStakingFinalFeeLevel } from '../mocks';

describe('stakingFeeLevelSchema', () => {
    it('parses an ethereum level with its EIP-1559 extras', () => {
        const level = mockStakingFinalFeeLevel({
            extras: {
                estimatedFeeLimit: '220000',
                maxFeePerGas: '30',
                maxPriorityFeePerGas: '1',
            },
        });

        expect(stakingFeeLevelSchema.parse(level)).toEqual(level);
    });

    it('parses a solana level with a compute limit', () => {
        const level = mockStakingFinalFeeLevel({
            fee: '5000' as never,
            totalSpent: '1000005000' as never,
            feePerUnit: '50',
            feeLimit: '200000',
            extras: {},
        });

        expect(stakingFeeLevelSchema.parse(level)).toEqual(level);
    });

    it('keeps the missing cardano rate and limit as null', () => {
        const level = mockStakingFinalFeeLevel({
            fee: '174345' as never,
            totalSpent: '2174345' as never,
            feePerUnit: null,
            feeLimit: null,
            extras: {},
        });

        expect(stakingFeeLevelSchema.parse(level)).toEqual(level);
    });

    it('keeps the tron bandwidth as a numeric extra', () => {
        const level = mockStakingFinalFeeLevel({
            fee: '1100000' as never,
            totalSpent: '1001100000' as never,
            feePerUnit: '1000',
            feeLimit: null,
            extras: { bytes: 283 },
        });

        expect(stakingFeeLevelSchema.parse(level)).toEqual(level);
    });

    it('parses an error level with and without a message', () => {
        const withMessage = mockStakingErrorFeeLevel();
        const withoutMessage = mockStakingErrorFeeLevel({ errorMessage: null });

        expect(stakingFeeLevelSchema.parse(withMessage)).toEqual(withMessage);
        expect(stakingFeeLevelSchema.parse(withoutMessage)).toEqual(withoutMessage);
    });

    it('rejects a fee that is not in base units', () => {
        const result = stakingFeeLevelSchema.safeParse(
            mockStakingFinalFeeLevel({ fee: '0.000462' as never }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['fee']);
    });

    it('rejects a level with a bitcoin-only key', () => {
        const result = stakingFeeLevelSchema.safeParse({
            ...mockStakingFinalFeeLevel(),
            inputs: [],
        });

        expect(result.success).toBe(false);
    });

    it('rejects an extra the fee pickers do not read', () => {
        const result = stakingFeeLevelSchema.safeParse(
            mockStakingFinalFeeLevel({ extras: { solanaTxMeta: { rentLamports: '0' } } as never }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['extras']);
    });

    it('rejects an extra of the wrong type', () => {
        const result = stakingFeeLevelSchema.safeParse(
            mockStakingFinalFeeLevel({ extras: { maxFeePerGas: 30 } as never }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['extras', 'maxFeePerGas']);
    });

    it('rejects a rate or a limit that is not a number', () => {
        const rate = stakingFeeLevelSchema.safeParse(mockStakingFinalFeeLevel({ feePerUnit: '' }));
        const limit = stakingFeeLevelSchema.safeParse(
            mockStakingFinalFeeLevel({ feeLimit: '1.5' }),
        );

        expect(rate.success).toBe(false);
        expect(rate.error?.issues[0]?.path).toEqual(['feePerUnit']);
        expect(limit.success).toBe(false);
        expect(limit.error?.issues[0]?.path).toEqual(['feeLimit']);
    });
});

describe('stakingFeeLevelsSchema', () => {
    it('parses every level a compose can return', () => {
        const feeLevels = mockStakingFeeLevels({ custom: mockStakingErrorFeeLevel() });

        expect(stakingFeeLevelsSchema.parse(feeLevels)).toEqual(feeLevels);
    });

    it('accepts a single level, as the tron composes return', () => {
        const feeLevels = { normal: mockStakingFinalFeeLevel() };

        expect(stakingFeeLevelsSchema.parse(feeLevels)).toEqual(feeLevels);
    });

    it('requires a normal level', () => {
        const empty = stakingFeeLevelsSchema.safeParse({});
        const customOnly = stakingFeeLevelsSchema.safeParse({ custom: mockStakingFinalFeeLevel() });

        expect(empty.success).toBe(false);
        expect(empty.error?.issues[0]?.path).toEqual(['normal']);
        expect(customOnly.success).toBe(false);
    });

    it('rejects an unknown label', () => {
        const result = stakingFeeLevelsSchema.safeParse({ fastest: mockStakingFinalFeeLevel() });

        expect(result.success).toBe(false);
    });

    it('uses connect labels and leaves out the bitcoin-only economy tier', () => {
        const labels: readonly FeeLevel['label'][] = STAKING_FEE_LEVEL_LABELS;
        const stakingLabel: StakingFeeLevelLabel = 'low';

        expect(labels).toEqual(['low', 'normal', 'high', 'custom']);
        expect(stakingLabel).toBe('low');
        expect(
            stakingFeeLevelsSchema.safeParse({ economy: mockStakingFinalFeeLevel() }).success,
        ).toBe(false);
    });
});

describe('stakingCustomFeeSchema', () => {
    it('parses the fields the desktop custom fee form fills', () => {
        const customFee = {
            feePerUnit: '25',
            feeLimit: '220000',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '1',
        };

        expect(stakingCustomFeeSchema.parse(customFee)).toEqual(customFee);
    });

    it('needs only the rate', () => {
        expect(stakingCustomFeeSchema.parse({ feePerUnit: '25' })).toEqual({ feePerUnit: '25' });
    });

    it('rejects a rate that is not a number', () => {
        expect(stakingCustomFeeSchema.safeParse({ feePerUnit: '' }).success).toBe(false);
        expect(stakingCustomFeeSchema.safeParse({ feePerUnit: '5 gwei' }).success).toBe(false);
    });

    it('takes the EIP-1559 pair together or not at all', () => {
        const halfPair = stakingCustomFeeSchema.safeParse({ feePerUnit: '5', maxFeePerGas: '30' });

        expect(halfPair.success).toBe(false);
        expect(halfPair.error?.issues[0]?.path).toEqual(['maxPriorityFeePerGas']);
        expect(
            stakingCustomFeeSchema.safeParse({ feePerUnit: '5', maxPriorityFeePerGas: '1' })
                .success,
        ).toBe(false);
    });
});
