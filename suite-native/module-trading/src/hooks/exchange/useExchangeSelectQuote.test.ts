import React from 'react';

import type { ExchangeTrade } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import {
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    tradingExchangeActions,
} from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    btcAsset,
    getBtcAccount,
    getEthAccount,
    getInitializedTradingStateWithQuotes,
    invityDexQuote,
    mercuryoFixedBestQuote,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from './useExchangeForm';
import { useExchangeSelectQuote } from './useExchangeSelectQuote';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
        }),
        prefetchDexQuoteApprovalThunk: () => () => ({
            unwrap: () => Promise.resolve(undefined),
        }),
    },
}));

const mockNavigation = {
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

type ReportSpy = jest.SpyInstance;

const useExchangeSelectQuoteWithReportSpy = (exchangeForm: ExchangeFormType) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const spyRef = React.useRef<ReportSpy | null>(null);
    if (!spyRef.current) {
        spyRef.current = jest.spyOn(analytics, 'report');
    }

    const hookResult = useExchangeSelectQuote(exchangeForm);

    return { ...hookResult, reportSpy: spyRef.current! };
};

describe('useExchangeSelectQuote', () => {
    let exchangeForm: ExchangeFormType;
    let store: TestStore;

    const btcAccount = getBtcAccount({ descriptor: asAccountDescriptor('btcAccountKey') });
    const ethAccount = getEthAccount({ descriptor: asAccountDescriptor('ethAccountKey') });

    const getInitializedStore = ({
        isLoading,
        dexQuoteApprovalPrefetchLoadingQuoteId,
    }: {
        isLoading?: boolean;
        dexQuoteApprovalPrefetchLoadingQuoteId?: string;
    }) => {
        const tradingState = getInitializedTradingStateWithQuotes();

        if (isLoading !== undefined) {
            tradingState.exchange.isLoading = isLoading;
        }
        if (dexQuoteApprovalPrefetchLoadingQuoteId !== undefined) {
            tradingState.exchange.dexQuoteApprovalPrefetchLoadingQuoteId =
                dexQuoteApprovalPrefetchLoadingQuoteId;
        }

        tradingState.exchange.tradingAccountKey = btcAccount.key;
        tradingState.exchange.receiveAccountKey = ethAccount.key;

        return createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: tradingState,
                    accounts: [btcAccount, ethAccount],
                },
            },
        });
    };

    const renderExchangeForm = async () =>
        await renderHookWithStoreProvider(() => useExchangeForm(), { store });

    const renderUseExchangeSelectQuote = async () => {
        const hook = await renderHookWithStoreProvider(
            () => useExchangeSelectQuoteWithReportSpy(exchangeForm),
            { store },
        );

        const spy = hook.result.current.reportSpy;
        const reportMock = spy as unknown as jest.Mock;

        return { result: hook.result, reportMock };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('while loading quotes', () => {
        beforeEach(async () => {
            store = getInitializedStore({ isLoading: true });

            const { result } = await renderExchangeForm();
            exchangeForm = result.current;
        });

        it('should canProceed be false when loading', async () => {
            const { result } = await renderUseExchangeSelectQuote();
            expect(result.current.canProceed).toBe(false);
            expect(result.current.isLoading).toBe(true);
            expect(result.current.isDexQuoteApprovalPrefetchLoadingForCandidateQuote).toBe(false);
        });

        it('selectQuote should not dispatch selectQuoteThunk when isLoading', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            await act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('selectQuoteForRevoke should not dispatch selectQuoteThunk when isLoading', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            await act(() => {
                result.current.selectQuoteForRevoke();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });
    });

    describe('while prefetching dex quote approval info', () => {
        beforeEach(async () => {
            store = getInitializedStore({
                isLoading: false,
                dexQuoteApprovalPrefetchLoadingQuoteId: invityDexQuote.quoteId!,
            });

            const { result } = await renderExchangeForm();
            exchangeForm = result.current;

            await act(() => {
                exchangeForm.setValue('quote', invityDexQuote);
            });
        });

        it('should canProceed be false while prefetch is loading for approval-required quote', async () => {
            const { result } = await renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(false);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isDexQuoteApprovalPrefetchLoadingForCandidateQuote).toBe(true);
        });

        it('should not dispatch selectQuoteThunk while prefetch is loading for approval-required quote', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            await act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('should canProceed be true while prefetch is loading for quote without approval', async () => {
            await act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const { result } = await renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('should canProceed be true when another approval-required quote is currently prefetched', async () => {
            await act(() => {
                exchangeForm.setValue('quote', {
                    ...invityDexQuote,
                    quoteId: 'another-dex-quote-id',
                });
            });

            const { result } = await renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('selectQuoteForRevoke should not dispatch selectQuoteThunk while prefetch is loading for approval-required quote', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            await act(() => {
                result.current.selectQuoteForRevoke();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });
    });

    describe('with quote loaded and selected', () => {
        beforeEach(async () => {
            store = getInitializedStore({ isLoading: false });

            const { result } = await renderExchangeForm();
            exchangeForm = result.current;

            await act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });
        });

        it('should canProceed be true when not loading and quote exists', async () => {
            const { result } = await renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('should call selectQuoteThunk when selectQuote is called', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeSelectQuote();

            await act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'selectQuoteThunkMock',
                    payload: expect.objectContaining({
                        quote: expect.objectContaining({
                            quoteId: mercuryoFixedBestQuote?.quoteId,
                        }),
                    }),
                }),
            );
        });

        it('should apply default slippage when selecting a DEX quote without slippage', async () => {
            const quote = { ...invityDexQuote, swapSlippage: undefined };
            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const [selectQuoteCall] = dispatchSpy.mock.calls;
            const selectQuoteAction = selectQuoteCall?.[0] as unknown as {
                payload: { nextStep: () => void; quote: ExchangeTrade };
            };

            expect(selectQuoteAction.payload.quote.swapSlippage).toBe(
                TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
            );

            await act(() => {
                selectQuoteAction.payload.nextStep();
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                tradingExchangeActions.saveSelectedQuote({
                    ...quote,
                    swapSlippage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
                }),
            );
        });

        it('should not call selectQuoteThunk when account is not fully selected', async () => {
            await act(() => {
                [
                    tradingExchangeActions.setReceiveAccountKey(btcAccount.key),
                    tradingExchangeActions.setTradingAccountKey(ethAccount.key),
                ].forEach(store.dispatch);
                exchangeForm.setValue('receiveAsset', btcAsset);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result, reportMock } = await renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            await act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
            expect(mockNavigation.navigate).toHaveBeenCalledWith('ReceiveAccounts', {
                symbol: 'btc',
                tradingType: 'exchange',
            });

            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({
                    step: 'account-selection',
                    action: 'continue',
                    exchangeName: 'mercuryo',
                }),
            });
        });

        it('should navigate to TradingExchangePreview when nextStep callback is executed', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview', {});
        });

        describe('selectQuoteForRevoke', () => {
            it('should call selectQuoteThunk when selectQuoteForRevoke is called', async () => {
                const dispatchSpy = jest.spyOn(store, 'dispatch');

                const { result } = await renderUseExchangeSelectQuote();

                await act(() => {
                    result.current.selectQuoteForRevoke();
                });

                expect(dispatchSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'selectQuoteThunkMock',
                        payload: expect.objectContaining({
                            quote: expect.objectContaining({
                                quoteId: mercuryoFixedBestQuote.quoteId,
                            }),
                        }),
                    }),
                );
            });

            it('should not call selectQuoteThunk when account is not fully selected', async () => {
                await act(() => {
                    [
                        tradingExchangeActions.setReceiveAccountKey(btcAccount.key),
                        tradingExchangeActions.setTradingAccountKey(ethAccount.key),
                    ].forEach(store.dispatch);
                    exchangeForm.setValue('receiveAsset', btcAsset);
                });

                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const { result, reportMock } = await renderUseExchangeSelectQuote();

                dispatchSpy.mockClear();
                await act(() => {
                    result.current.selectQuoteForRevoke();
                });

                expect(dispatchSpy).not.toHaveBeenCalled();
                expect(mockNavigation.navigate).toHaveBeenCalledWith('ReceiveAccounts', {
                    symbol: 'btc',
                    tradingType: 'exchange',
                });

                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingExchangeEvent.name,
                    payload: expect.objectContaining({
                        step: 'account-selection',
                        action: 'revoke',
                        exchangeName: 'mercuryo',
                    }),
                });
            });
        });
    });

    describe('navigation based on approval status', () => {
        beforeEach(async () => {
            store = getInitializedStore({ isLoading: false });

            const { result } = await renderExchangeForm();
            exchangeForm = result.current;
        });

        it('should navigate to TradingExchangePreview when quote status is CONFIRM', async () => {
            const quote = { ...mercuryoFixedBestQuote, status: 'CONFIRM' as const };

            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview', {});
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/saveSelectedQuote',
                payload: quote,
            });
            const dispatchedTypes = dispatchSpy.mock.calls.map(([action]) => (action as any)?.type);
            expect(dispatchedTypes).not.toContain('@trading-exchange/savePreselectedQuote');
        });

        it('should navigate to TradingExchangePreview when quote status is SIGN_DATA', async () => {
            const quote = { ...mercuryoFixedBestQuote, status: 'SIGN_DATA' as const };

            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview', {});
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/saveSelectedQuote',
                payload: quote,
            });
        });

        it('should navigate to TradingExchangeApproval when quote status is APPROVAL_REQ with no preapproval', async () => {
            const quote = { ...invityDexQuote, status: 'APPROVAL_REQ' as const };

            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeApproval', {});
            // The hook persists the normalized quote before navigating to the approval screen.
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/saveSelectedQuote',
                payload: {
                    ...quote,
                    swapSlippage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
                },
            });
            const dispatchedTypes = dispatchSpy.mock.calls.map(([action]) => (action as any)?.type);
            expect(dispatchedTypes).not.toContain('@trading-exchange/savePreselectedQuote');
        });

        it('should navigate to TradingExchangeApproval with shouldIncreaseLimit when status is APPROVAL_REQ, preapproved, token supports increase', async () => {
            const quote = {
                ...invityDexQuote,
                status: 'APPROVAL_REQ' as const,
                preapprovedStringAmount: '10',
            };

            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeApproval', {
                shouldIncreaseLimit: true,
            });
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/saveSelectedQuote',
                payload: {
                    ...quote,
                    swapSlippage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
                },
            });
            const dispatchedTypes = dispatchSpy.mock.calls.map(([action]) => (action as any)?.type);
            expect(dispatchedTypes).not.toContain('@trading-exchange/savePreselectedQuote');
        });

        it('should navigate to TradingExchangeRevoke with shouldIncreaseLimit when status is APPROVAL_REQ, preapproved, token does not support increase (USDT)', async () => {
            const quote = {
                ...invityDexQuote,
                status: 'APPROVAL_REQ' as const,
                preapprovedStringAmount: '10',
                // USDT contract does not support increasing allowance
                send: 'ethereum--0xdAC17F958D2ee523a2206206994597C13D831ec7' as any,
            };

            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuote();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeRevoke', {
                shouldIncreaseLimit: true,
            });
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/saveSelectedQuote',
                payload: {
                    ...quote,
                    swapSlippage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
                },
            });
        });

        it('selectQuoteForRevoke should navigate to TradingExchangeRevoke with shouldIncreaseLimit: false when quote has preapproval', async () => {
            const quote = {
                ...invityDexQuote,
                preapprovedStringAmount: '10',
            };

            await act(() => {
                exchangeForm.setValue('quote', quote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuoteForRevoke();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeRevoke', {
                shouldIncreaseLimit: false,
            });
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/saveSelectedQuote',
                payload: {
                    ...quote,
                    swapSlippage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
                },
            });
            const dispatchedTypes = dispatchSpy.mock.calls.map(([action]) => (action as any)?.type);
            expect(dispatchedTypes).not.toContain('@trading-exchange/savePreselectedQuote');
        });

        it('selectQuoteForRevoke should not navigate when quote has no preapproval', async () => {
            await act(() => {
                exchangeForm.setValue('quote', invityDexQuote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            await act(() => {
                result.current.selectQuoteForRevoke();
            });

            const { calls } = dispatchSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCall: (typeof calls)[number] = calls[0];
            const [dispatchCall] = firstCall;
            const { nextStep } = (dispatchCall as any).payload;

            await act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });
    });
});
