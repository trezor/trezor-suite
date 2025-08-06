import { FormState, GeneralPrecomposedLevels, TokenAddress } from '@suite-common/wallet-types';

import {
    selectCustomFeeLevel,
    selectDestinationTagFromDraft,
    selectFeeLevelTransactionBytes,
    selectFeeLevels,
} from '../selectors';
import { NativeSendRootState } from '../sendFormSlice';
import { NativeSupportedFeeLevel } from '../types';

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

describe('send selectors', () => {
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
            const result = selectFeeLevelTransactionBytes(
                state,
                'normal' as NativeSupportedFeeLevel,
            );

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

    describe('selectDestinationTagFromDraft', () => {
        it('should return destination tag when it exists in draft', () => {
            const mockDrafts = {
                'btc-0': {
                    destinationTag: '12345',
                    outputs: [],
                    selectedFee: 'normal',
                },
            };

            // Cast mockDrafts to the correct type to satisfy FormState requirements
            const mockDraftsTyped: Record<string, FormState> = mockDrafts as unknown as Record<
                string,
                FormState
            >;

            const state = createMockState({ drafts: mockDraftsTyped });
            const result = selectDestinationTagFromDraft(state, 'btc-0');

            expect(result).toBe('12345');
        });

        it('should return undefined when draft does not exist', () => {
            const state = createMockState();
            const result = selectDestinationTagFromDraft(state, 'btc-0');

            expect(result).toBeUndefined();
        });

        it('should handle token contract parameter', () => {
            const mockDrafts = {
                'eth-0-0x1234567890123456789012345678901234567890': {
                    destinationTag: '67890',
                    outputs: [],
                    selectedFee: 'normal',
                },
            };

            const mockDraftsTyped: Record<string, FormState> = mockDrafts as unknown as Record<
                string,
                FormState
            >;

            const state = createMockState({ drafts: mockDraftsTyped });
            const result = selectDestinationTagFromDraft(
                state,
                'eth-0',
                '0x1234567890123456789012345678901234567890' as TokenAddress,
            );

            expect(result).toBe('67890');
        });
    });
});
