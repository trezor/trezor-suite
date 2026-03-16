import { type FeeLevelLabel, type GeneralPrecomposedLevels } from '@suite-common/wallet-types';

import {
    selectCustomFeeLevel,
    selectFeeLevelTransactionBytes,
    selectFeeLevels,
    selectIsTransactionAlreadySigned,
} from '../selectors';
import { type NativeSendRootState } from '../sendFormSlice';

const createMockState = (
    overrides: Partial<NativeSendRootState['wallet']['send']> = {},
): NativeSendRootState => ({
    wallet: {
        send: {
            feeLevels: {},
            error: null,
            drafts: {},
            ...overrides,
        },
    },
});

describe('transaction-management selectors', () => {
    describe('selectFeeLevels', () => {
        it('should return fee levels from state', () => {
            const mockFeeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    fee: '1000',
                    feePerByte: '1',
                    feeLimit: '1000',
                    bytes: 1500,
                },
            } as unknown as GeneralPrecomposedLevels;

            const state = createMockState({ feeLevels: mockFeeLevels });
            const result = selectFeeLevels(state);

            expect(result).toEqual(mockFeeLevels);
        });

        it('should return empty object when no fee levels', () => {
            const state = createMockState();
            const result = selectFeeLevels(state);

            expect(result).toEqual({});
        });
    });

    describe('selectCustomFeeLevel', () => {
        it('should return custom fee level when it exists', () => {
            const mockCustomFeeLevel: GeneralPrecomposedLevels = {
                type: 'final',
                fee: '1500',
                feePerByte: '1.5',
                feeLimit: '1000',
                bytes: 1000,
                totalSpent: '2500',
            } as unknown as GeneralPrecomposedLevels;

            const mockFeeLevels: GeneralPrecomposedLevels = {
                custom: mockCustomFeeLevel,
                normal: {
                    type: 'final',
                    fee: '1000',
                    feePerByte: '1',
                    feeLimit: '1000',
                    bytes: 1000,
                    totalSpent: '1000',
                },
            } as unknown as GeneralPrecomposedLevels;

            const state = createMockState({ feeLevels: mockFeeLevels });
            const result = selectCustomFeeLevel(state);

            expect(result).toEqual(mockCustomFeeLevel);
        });

        it('should return undefined when custom fee level does not exist', () => {
            const mockFeeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    fee: '1000',
                    feePerByte: '1',
                    feeLimit: '1000',
                    bytes: 1000,
                },
            } as unknown as GeneralPrecomposedLevels;

            const state = createMockState({ feeLevels: mockFeeLevels });
            const result = selectCustomFeeLevel(state);

            expect(result).toBeUndefined();
        });
    });

    describe('selectFeeLevelTransactionBytes', () => {
        it('should return bytes when fee level exists and has bytes', () => {
            const mockFeeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    fee: '1000',
                    feePerByte: '1',
                    feeLimit: '1000',
                    bytes: 1500,
                },
            } as unknown as GeneralPrecomposedLevels;

            const state = createMockState({ feeLevels: mockFeeLevels });
            const result = selectFeeLevelTransactionBytes(state, 'normal');

            expect(result).toBe(1500);
        });

        it('should calculate bytes for Ethereum-based fee level', () => {
            const mockFeeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    fee: '1000',
                    feePerByte: '2',
                    feeLimit: '500',
                    bytes: 0, // Ethereum-based fee level
                },
            } as unknown as GeneralPrecomposedLevels;

            const state = createMockState({ feeLevels: mockFeeLevels });
            const result = selectFeeLevelTransactionBytes(state, 'normal');

            // Expected calculation: 1000 / 2 / 500 = 1
            expect(result).toBe(1);
        });

        it('should return 0 when fee level does not exist', () => {
            const state = createMockState();
            const result = selectFeeLevelTransactionBytes(state, 'normal' as FeeLevelLabel);

            expect(result).toBe(0);
        });

        it('should return 0 when fee level has error type', () => {
            const mockFeeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'error',
                    error: 'Transaction failed',
                },
            } as unknown as GeneralPrecomposedLevels;

            const state = createMockState({ feeLevels: mockFeeLevels });
            const result = selectFeeLevelTransactionBytes(state, 'normal');

            expect(result).toBe(0);
        });
    });

    describe('selectIsTransactionAlreadySigned', () => {
        it('should be false when wallet.send.serializedTx is not defined', () => {
            const state = createMockState();

            expect(selectIsTransactionAlreadySigned(state)).toBe(false);
        });

        it('should be true when wallet.send.serializedTx is defined', () => {
            const state = createMockState({ serializedTx: { tx: 'tx_data', symbol: 'btc' } });

            expect(selectIsTransactionAlreadySigned(state)).toBe(true);
        });
    });
});
