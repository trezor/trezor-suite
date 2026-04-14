import { tradingActions } from '@suite-common/trading';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import {
    type PreloadedState,
    type TestStore,
    initStore,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils';
import { getWalletState, invityDexQuote } from '@suite-native/trading-fixtures';

import { useEvmApprovalFees } from '../useEvmApprovalFees';

const mockComposeEvmApprovalFeeLevelsThunk = jest.fn();

jest.mock('../../../../thunks', () => ({
    composeEvmApprovalFeeLevelsThunk: (...args: any[]) =>
        mockComposeEvmApprovalFeeLevelsThunk(...args),
}));

describe('useEvmApprovalFees', () => {
    let store: TestStore;
    let preloadedState: PreloadedState;

    const exchangeFormDraftKey = getFormDraftKey('trading-exchange', '');

    const ethFeeInfoPreload = {
        eth: {
            status: 'loaded' as const,
            data: {
                blockHeight: 1000,
                blockTime: 15,
                minFee: 1,
                maxFee: 100,
                levels: [{ label: 'normal' as const, feePerUnit: '20', blocks: 1 }],
            },
        },
    };

    const dexQuoteWithApprovalData = {
        ...invityDexQuote,
        isDex: true,
        sendStringAmount: '100',
        send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        dexTx: {
            to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
            data: '0x095ea7b3000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee570000000000000000000000000000000000000000000000000000000005f5e100',
            value: '0x0',
        },
    };

    beforeEach(() => {
        mockComposeEvmApprovalFeeLevelsThunk.mockReset().mockImplementation(() => ({
            type: 'composeEvmApprovalFeeLevelsThunk',
            unwrap: jest.fn().mockResolvedValue({}),
        }));

        preloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'eth-account-1' as AccountKey;
        preloadedState.wallet!.trading!.exchange!.selectedQuote = dexQuoteWithApprovalData;

        store = initStore(preloadedState).store;
    });

    const renderUseEvmApprovalFees = (params?: Parameters<typeof useEvmApprovalFees>[0]) =>
        renderHookWithStoreProvider(() => useEvmApprovalFees(params), { store });

    it('should return isLoading true when fee is undefined', () => {
        const { result } = renderUseEvmApprovalFees();

        expect(result.current).toEqual(
            expect.objectContaining({
                fee: undefined,
                error: null,
                isLoading: true,
                composeFees: expect.any(Function),
            }),
        );
    });

    it('should return fee and isLoading false when composed transaction info is available', () => {
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = undefined;
        store = initStore(preloadedState).store;

        store.dispatch(
            tradingActions.saveComposedTransactionInfo({
                selectedFee: 'normal',
                composed: { fee: '50000', feePerByte: '0' },
            }),
        );

        const { result } = renderUseEvmApprovalFees();

        expect(result.current.fee).toBe('50000');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should return translated error when composing fails', async () => {
        mockComposeEvmApprovalFeeLevelsThunk.mockImplementation(() => ({
            type: 'composeEvmApprovalFeeLevelsThunk',
            unwrap: jest.fn().mockRejectedValue(new Error('compose failed')),
        }));

        preloadedState!.wallet!.fees = {
            eth: {
                status: 'loaded',
                data: {
                    blockHeight: 1000,
                    blockTime: 15,
                    minFee: 1,
                    maxFee: 100,
                    levels: [{ label: 'normal', feePerUnit: '20', blocks: 1 }],
                },
            },
        };
        store = initStore(preloadedState).store;

        const { result } = renderUseEvmApprovalFees();

        await waitFor(() => {
            expect(result.current.error).toBe(
                'Failed to estimate approval fees. Please try again.',
            );
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should accept approvalTypeOverride parameter', () => {
        const { result } = renderUseEvmApprovalFees({ approvalTypeOverride: 'ZERO' });

        expect(result.current).toEqual(
            expect.objectContaining({
                composeFees: expect.any(Function),
            }),
        );
    });

    it('should pass selected fee level from exchange form draft to compose thunk', async () => {
        preloadedState!.wallet!.fees = ethFeeInfoPreload;
        preloadedState!.wallet!.formDrafts = {
            [exchangeFormDraftKey]: { selectedFee: 'high' },
        };
        store = initStore(preloadedState).store;

        renderUseEvmApprovalFees();

        await waitFor(() => {
            expect(mockComposeEvmApprovalFeeLevelsThunk).toHaveBeenCalled();
        });

        expect(mockComposeEvmApprovalFeeLevelsThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedFeeLevel: 'high',
            }),
        );
    });

    it('should pass custom fee fields from exchange form draft when fee level is custom', async () => {
        preloadedState!.wallet!.fees = ethFeeInfoPreload;
        preloadedState!.wallet!.formDrafts = {
            [exchangeFormDraftKey]: {
                selectedFee: 'custom',
                feeLimit: '21000',
                feePerUnit: '25',
                maxFeePerGas: '100',
                maxPriorityFeePerGas: '2',
            },
        };
        store = initStore(preloadedState).store;

        renderUseEvmApprovalFees();

        await waitFor(() => {
            expect(mockComposeEvmApprovalFeeLevelsThunk).toHaveBeenCalled();
        });

        expect(mockComposeEvmApprovalFeeLevelsThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedFeeLevel: 'custom',
                customFee: {
                    feeLimit: '21000',
                    feePerUnit: '25',
                    maxFeePerGas: '100',
                    maxPriorityFeePerGas: '2',
                },
            }),
        );
    });

    it('should default to normal fee level when exchange form draft has no selected fee', async () => {
        preloadedState!.wallet!.fees = ethFeeInfoPreload;
        preloadedState!.wallet!.formDrafts = {
            [exchangeFormDraftKey]: {
                outputs: [
                    {
                        type: 'payment' as const,
                        address: '',
                        amount: '0',
                        fiat: '',
                        currency: { label: '', value: '' },
                        label: '',
                        token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
                    },
                ],
            },
        };
        store = initStore(preloadedState).store;

        renderUseEvmApprovalFees();

        await waitFor(() => {
            expect(mockComposeEvmApprovalFeeLevelsThunk).toHaveBeenCalled();
        });

        expect(mockComposeEvmApprovalFeeLevelsThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedFeeLevel: 'normal',
                customFee: undefined,
            }),
        );
    });
});
