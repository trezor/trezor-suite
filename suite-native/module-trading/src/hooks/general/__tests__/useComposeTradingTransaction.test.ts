import { formDraftActions } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { FeatureFlag } from '@suite-native/feature-flags';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { getFormDraftKeyByTradeType } from '@suite-native/trading-state';

import { createTradingLightStore } from '../../../__tests__/tradingTestUtils';
import { useComposeTradingTransaction } from '../useComposeTradingTransaction';

const mockComposeTradingTransactionThunk = jest.fn(
    (payload: unknown) => () =>
        Object.assign(Promise.resolve({ type: 'composeTradingTransactionThunkMock', payload }), {
            unwrap: () => Promise.resolve(true),
        }),
);

jest.mock('../../../thunks', () => ({
    composeTradingTransactionThunk: (payload: unknown) =>
        mockComposeTradingTransactionThunk(payload),
}));

const btcAccount = getBtcAccount({ descriptor: asAccountDescriptor('btc1') });
const exchangeFormDraftKey = getFormDraftKeyByTradeType('exchange');

const btcFeeInfo = {
    blockHeight: 100,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal' as const, feePerUnit: '1', blocks: 1 }],
};

describe('useComposeTradingTransaction', () => {
    const getInitializedStore = (): TestStore => {
        const tradingState = getInitializedTradingStateWithQuotes();
        tradingState.exchange.tradingAccountKey = btcAccount.key;
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

        return createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                featureFlags: { [FeatureFlag.IsTradingSlip24Enabled]: true },
                device: {
                    selectedDevice: {
                        features: { major_version: 2, minor_version: 12, patch_version: 1 },
                    },
                },
                wallet: {
                    accounts: [btcAccount],
                    fees: {
                        btc: {
                            status: 'loaded',
                            data: btcFeeInfo,
                        },
                    },
                    formDrafts: {
                        [exchangeFormDraftKey]: {
                            selectedFee: 'normal',
                            feePerUnit: '1',
                            feeLimit: '100',
                        },
                    },
                    trading: tradingState,
                },
            },
        });
    };

    const renderUseComposeTradingTransaction = (store: TestStore) =>
        renderHookWithStoreProvider(() => useComposeTradingTransaction({ tradeType: 'exchange' }), {
            store,
        });

    beforeEach(() => {
        mockComposeTradingTransactionThunk.mockClear();
    });

    it('should compose transaction with latest draft fee values from store', async () => {
        const store = getInitializedStore();

        const { result } = renderUseComposeTradingTransaction(store);

        act(() => {
            store.dispatch(
                formDraftActions.storeDraft({
                    key: exchangeFormDraftKey,
                    formDraft: {
                        selectedFee: 'custom',
                        feePerUnit: '42',
                        feeLimit: '21000',
                        maxPriorityFeePerGas: '2',
                        maxFeePerGas: '100',
                    },
                }),
            );
        });

        await act(async () => {
            await result.current.composeTradingTransaction();
        });

        expect(mockComposeTradingTransactionThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                tradeType: 'exchange',
                account: expect.objectContaining({
                    key: btcAccount.key,
                }),
                feeInfo: expect.objectContaining({
                    blockHeight: btcFeeInfo.blockHeight,
                    blockTime: btcFeeInfo.blockTime,
                    minFee: btcFeeInfo.minFee,
                    maxFee: btcFeeInfo.maxFee,
                }),
                selectedFeeLevel: 'custom',
                feePerUnit: '42',
                feeLimit: '21000',
                maxPriorityFeePerGas: '2',
                maxFeePerGas: '100',
                isSlip24Active: true,
            }),
        );
    });
});
