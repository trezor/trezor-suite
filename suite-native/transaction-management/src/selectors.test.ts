import { type FeeLevelLabel, type GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { isClearSignedEvmTradingSwapTransaction } from '@suite-common/wallet-utils';

import { ETH_ACCOUNT_KEY, getEthAccount, getWalletState } from './__fixtures__/walletState';
import {
    type TransactionReviewOutputsState,
    selectCustomFeeLevel,
    selectFeeLevelTransactionBytes,
    selectFeeLevels,
    selectFormDraftByPrefix,
    selectIsClearSignedTradingSwap,
    selectIsTransactionAlreadySigned,
} from './selectors';
import { type NativeSendRootState } from './sendFormSlice';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    isClearSignedEvmTradingSwapTransaction: jest.fn().mockReturnValue(false),
}));

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

    describe('selectIsClearSignedTradingSwap', () => {
        const PREFIX = 'trading-exchange' as const;
        const FORM_DRAFT_KEY = PREFIX + '/';

        const buildClearSignedTradingSwapState = ({
            includeAccount = true,
            includeDevice = true,
            includeFormDraft = true,
            includePrecomposedTx = true,
        } = {}): TransactionReviewOutputsState =>
            ({
                wallet: {
                    ...getWalletState(),
                    accounts: includeAccount ? [getEthAccount()] : [],
                    send: {
                        ...getWalletState().send,
                        precomposedTx: includePrecomposedTx ? { outputs: [] } : undefined,
                    },
                    formDrafts: includeFormDraft
                        ? { [FORM_DRAFT_KEY]: { transactionData: null, trading: null } }
                        : {},
                },
                device: {
                    selectedDevice: includeDevice ? { connected: true } : undefined,
                },
            }) as unknown as TransactionReviewOutputsState;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('returns false when account is missing', () => {
            const state = buildClearSignedTradingSwapState({ includeAccount: false });
            const result = selectIsClearSignedTradingSwap(state, ETH_ACCOUNT_KEY, PREFIX);

            expect(result).toBe(false);
            expect(isClearSignedEvmTradingSwapTransaction).not.toHaveBeenCalled();
        });

        it('returns false when device is missing', () => {
            const state = buildClearSignedTradingSwapState({ includeDevice: false });
            const result = selectIsClearSignedTradingSwap(state, ETH_ACCOUNT_KEY, PREFIX);

            expect(result).toBe(false);
            expect(isClearSignedEvmTradingSwapTransaction).not.toHaveBeenCalled();
        });

        it('returns false when formDraft is missing for the prefix', () => {
            const state = buildClearSignedTradingSwapState({ includeFormDraft: false });
            const result = selectIsClearSignedTradingSwap(state, ETH_ACCOUNT_KEY, PREFIX);

            expect(result).toBe(false);
            expect(isClearSignedEvmTradingSwapTransaction).not.toHaveBeenCalled();
        });

        it('returns false when precomposedTx is missing', () => {
            const state = buildClearSignedTradingSwapState({ includePrecomposedTx: false });
            const result = selectIsClearSignedTradingSwap(state, ETH_ACCOUNT_KEY, PREFIX);

            expect(result).toBe(false);
            expect(isClearSignedEvmTradingSwapTransaction).not.toHaveBeenCalled();
        });

        it('returns true when all data is present and the transaction is clear-signed', () => {
            (isClearSignedEvmTradingSwapTransaction as jest.Mock).mockReturnValueOnce(true);

            const state = buildClearSignedTradingSwapState();
            const result = selectIsClearSignedTradingSwap(state, ETH_ACCOUNT_KEY, PREFIX);

            expect(result).toBe(true);
            expect(isClearSignedEvmTradingSwapTransaction).toHaveBeenCalledTimes(1);
        });

        it('returns false when all data is present but the transaction is not clear-signed', () => {
            const state = buildClearSignedTradingSwapState();
            const result = selectIsClearSignedTradingSwap(state, ETH_ACCOUNT_KEY, PREFIX);

            expect(result).toBe(false);
            expect(isClearSignedEvmTradingSwapTransaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('selectFormDraftByPrefix', () => {
        const MOCK_DRAFT = { outputs: [{ type: 'payment', address: '0x123' }] };

        const buildState = (walletOverrides = {}): TransactionReviewOutputsState =>
            ({
                wallet: {
                    ...getWalletState(),
                    send: { ...getWalletState().send, drafts: {} },
                    formDrafts: {},
                    ...walletOverrides,
                },
                device: { selectedDevice: undefined },
            }) as unknown as TransactionReviewOutputsState;

        it('reads from send.drafts for the send prefix', () => {
            const state = buildState({
                send: { ...getWalletState().send, drafts: { [ETH_ACCOUNT_KEY]: MOCK_DRAFT } },
            });
            const result = selectFormDraftByPrefix(state, 'send', ETH_ACCOUNT_KEY);

            expect(result).toEqual(MOCK_DRAFT);
        });

        it('reads from formDrafts keyed by prefix/accountKey for staking prefixes', () => {
            const state = buildState({ formDrafts: { [`stake/${ETH_ACCOUNT_KEY}`]: MOCK_DRAFT } });
            const result = selectFormDraftByPrefix(state, 'stake', ETH_ACCOUNT_KEY);

            expect(result).toEqual(MOCK_DRAFT);
        });

        it('reads from formDrafts keyed by prefix/ for non-staking non-send prefixes', () => {
            const state = buildState({ formDrafts: { 'trading-buy/': MOCK_DRAFT } });
            const result = selectFormDraftByPrefix(state, 'trading-buy', ETH_ACCOUNT_KEY);

            expect(result).toEqual(MOCK_DRAFT);
        });
    });
});
