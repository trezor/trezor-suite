import {
    mockComposedStakingStep,
    mockStakingErrorFeeLevel,
    mockStakingFinalFeeLevel,
} from '@suite-common/earn-staking-common/mocks';

import { toPrecomposedLevels } from './toPrecomposedLevels';

describe('toPrecomposedLevels', () => {
    it('maps a final level onto the fields the fee pickers read', () => {
        const composedStep = mockComposedStakingStep({
            feeLevels: {
                normal: mockStakingFinalFeeLevel({
                    feeLimit: '220000',
                    max: '2000000000000000000' as never,
                    extras: {
                        estimatedFeeLimit: '210000',
                        maxFeePerGas: '30',
                        maxPriorityFeePerGas: '1',
                    },
                }),
            },
        });
        const { normal } = toPrecomposedLevels(composedStep);

        expect(normal).toEqual({
            type: 'final',
            fee: '462000000000000',
            totalSpent: '1000462000000000000',
            feePerByte: '2.1',
            feeLimit: '220000',
            max: '2000000000000000000',
            bytes: 0,
            inputs: [],
            outputs: [
                {
                    address: '0xD523794C879D9eC028960a231F866758e405bE34',
                    amount: '1000000000000000000',
                    script_type: 'PAYTOADDRESS',
                },
            ],
            outputsPermutation: [0],
            estimatedFeeLimit: '210000',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '1',
        });
    });

    it('keeps the tron bandwidth as bytes and the cardano rate empty', () => {
        const levels = toPrecomposedLevels(
            mockComposedStakingStep({
                feeLevels: {
                    normal: mockStakingFinalFeeLevel({
                        feePerUnit: '',
                        feeLimit: null,
                        extras: { bytes: 283 },
                    }),
                },
                outputs: [],
            }),
        );

        expect(levels.normal).toMatchObject({
            feePerByte: '',
            feeLimit: undefined,
            bytes: 283,
            outputs: [],
            outputsPermutation: [],
            estimatedFeeLimit: undefined,
        });
    });

    it('maps error levels with and without a message', () => {
        const levels = toPrecomposedLevels(
            mockComposedStakingStep({
                feeLevels: {
                    low: mockStakingErrorFeeLevel(),
                    normal: mockStakingFinalFeeLevel(),
                    high: mockStakingErrorFeeLevel({
                        error: 'TR_STAKE_TX_PREPARATION_FAILED',
                        errorMessage: null,
                    }),
                },
            }),
        );

        expect(levels.low).toEqual({
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: { networkDisplaySymbol: 'ETH' },
            },
        });
        expect(levels.high).toEqual({
            type: 'error',
            error: 'TR_STAKE_TX_PREPARATION_FAILED',
            errorMessage: undefined,
        });
        expect(Object.keys(levels)).toEqual(['low', 'normal', 'high']);
    });
});
