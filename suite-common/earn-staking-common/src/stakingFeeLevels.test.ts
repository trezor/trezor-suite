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

    it('parses a solana level with a compute limit and a review flag', () => {
        const level = mockStakingFinalFeeLevel({
            fee: '5000' as never,
            totalSpent: '1000005000' as never,
            feePerUnit: '50',
            feeLimit: '200000',
            extras: { isDeviceReviewOnly: true },
        });

        expect(stakingFeeLevelSchema.parse(level)).toEqual(level);
    });

    it('keeps the empty cardano rate and a missing limit', () => {
        const level = mockStakingFinalFeeLevel({
            fee: '174345' as never,
            totalSpent: '2174345' as never,
            feePerUnit: '',
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

    it('rejects a structured extra', () => {
        const result = stakingFeeLevelSchema.safeParse(
            mockStakingFinalFeeLevel({ extras: { solanaTxMeta: { rentLamports: '0' } } as never }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['extras', 'solanaTxMeta']);
    });
});

describe('stakingFeeLevelsSchema', () => {
    it('parses every level a compose can return', () => {
        const feeLevels = mockStakingFeeLevels({
            low: mockStakingFinalFeeLevel({ feePerUnit: '0.5' }),
            custom: mockStakingErrorFeeLevel(),
        });

        expect(stakingFeeLevelsSchema.parse(feeLevels)).toEqual(feeLevels);
    });

    it('accepts a single level, as the tron composes return', () => {
        const feeLevels = { normal: mockStakingFinalFeeLevel() };

        expect(stakingFeeLevelsSchema.parse(feeLevels)).toEqual(feeLevels);
    });

    it('rejects an unknown label', () => {
        const result = stakingFeeLevelsSchema.safeParse({ fastest: mockStakingFinalFeeLevel() });

        expect(result.success).toBe(false);
    });

    it('names every fee level label connect knows', () => {
        const labels: readonly FeeLevel['label'][] = STAKING_FEE_LEVEL_LABELS;
        const connectLabel: FeeLevel['label'] = 'economy';
        const stakingLabel: StakingFeeLevelLabel = connectLabel;

        expect(labels).toHaveLength(5);
        expect(stakingLabel).toBe('economy');
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

    it('rejects an empty rate', () => {
        expect(stakingCustomFeeSchema.safeParse({ feePerUnit: '' }).success).toBe(false);
    });
});
