import React from 'react';

import { tradingExchangeActions, tradingSettingsActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import {
    btcAsset,
    getBtcAccount,
    getEthAccount,
    getInitializedTradingStateWithQuotes,
    invityDexQuote,
    mercuryoFixedBestQuote,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../useExchangeForm';
import { useExchangeSelectQuote } from '../useExchangeSelectQuote';

const mockGetApprovalStatus = jest.fn();

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
    getApprovalStatus: (quote?: any) => mockGetApprovalStatus(quote),
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
    const analytics = useAnalytics();

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

    const getInitializedStore = ({
        isLoading,
        dexQuoteApprovalPrefetchLoadingQuoteId,
    }: {
        isLoading?: boolean;
        dexQuoteApprovalPrefetchLoadingQuoteId?: string;
    }) => {
        const btcAccount = getBtcAccount(
            'btc-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
        );
        const ethAccount = getEthAccount(
            'eth-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        const preloadedState: PreloadedState = {
            wallet: {
                trading: getInitializedTradingStateWithQuotes(),
                accounts: [btcAccount, ethAccount],
            },
        };

        if (isLoading !== undefined) {
            preloadedState.wallet!.trading!.exchange!.isLoading = isLoading;
        }
        if (dexQuoteApprovalPrefetchLoadingQuoteId !== undefined) {
            preloadedState.wallet!.trading!.exchange!.dexQuoteApprovalPrefetchLoadingQuoteId =
                dexQuoteApprovalPrefetchLoadingQuoteId;
        }

        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'btc-account-key';
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = 'eth-account-key';

        return initStore(preloadedState).store;
    };

    const renderExchangeForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), { store });

    const renderUseExchangeSelectQuote = () => {
        const hook = renderHookWithStoreProvider(
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
        beforeEach(() => {
            store = getInitializedStore({ isLoading: true });

            const { result } = renderExchangeForm();
            exchangeForm = result.current;
        });

        it('should canProceed be false when loading', () => {
            const { result } = renderUseExchangeSelectQuote();
            expect(result.current.canProceed).toBe(false);
        });

        it('selectQuote should not dispatch selectQuoteThunk when isLoading', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('selectQuoteForRevoke should not dispatch selectQuoteThunk when isLoading', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            act(() => {
                result.current.selectQuoteForRevoke();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });
    });

    describe('while prefetching dex quote approval info', () => {
        beforeEach(() => {
            store = getInitializedStore({
                isLoading: false,
                dexQuoteApprovalPrefetchLoadingQuoteId: invityDexQuote.quoteId!,
            });

            const { result } = renderExchangeForm();
            exchangeForm = result.current;

            act(() => {
                exchangeForm.setValue('quote', invityDexQuote);
            });
        });

        it('should canProceed be false while prefetch is loading for approval-required quote', async () => {
            const { result } = renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(false);
        });

        it('should not dispatch selectQuoteThunk while prefetch is loading for approval-required quote', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('should canProceed be true while prefetch is loading for quote without approval', async () => {
            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const { result } = renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('should canProceed be true when another approval-required quote is currently prefetched', async () => {
            act(() => {
                exchangeForm.setValue('quote', {
                    ...invityDexQuote,
                    quoteId: 'another-dex-quote-id',
                });
            });

            const { result } = renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('selectQuoteForRevoke should not dispatch selectQuoteThunk while prefetch is loading for approval-required quote', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            act(() => {
                result.current.selectQuoteForRevoke();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
        });
    });

    describe('with quote loaded and selected', () => {
        beforeEach(() => {
            store = getInitializedStore({ isLoading: false });

            const { result } = renderExchangeForm();
            exchangeForm = result.current;

            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });
        });

        it('should canProceed be true when not loading and quote exists', async () => {
            const { result } = renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('should call selectQuoteThunk when selectQuote is called', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'selectQuoteThunkMock',
                    payload: expect.objectContaining({
                        quote: expect.objectContaining({
                            quoteId: mercuryoFixedBestQuote?.quoteId,
                        }),
                        timer: expect.objectContaining({ timeSpent: { seconds: 0 } }),
                    }),
                }),
            );
        });

        it('should call selectQuoteThunk with correct maxSlippage value', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            act(() => {
                store.dispatch(tradingSettingsActions.setMaxSlippagePercentage('1.5'));
            });
            const { result } = renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'selectQuoteThunkMock',
                    payload: expect.objectContaining({
                        quote: expect.objectContaining({ swapSlippage: '1.5' }),
                        timer: expect.objectContaining({ timeSpent: { seconds: 0 } }),
                    }),
                }),
            );
        });

        it('should not call selectQuoteThunk when account is not fully selected', () => {
            act(() => {
                [
                    tradingExchangeActions.setReceiveAccountKey(
                        'btc-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                    tradingExchangeActions.setTradingAccountKey(
                        'eth-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                ].forEach(store.dispatch);
                exchangeForm.setValue('receiveAsset', btcAsset);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result, reportMock } = renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            act(() => {
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

        it('should navigate to TradingExchangePreview when nextStep callback is executed', () => {
            mockGetApprovalStatus.mockReturnValue('approved');

            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview', {});
        });

        describe('selectQuoteForRevoke', () => {
            it('should call selectQuoteThunk when selectQuoteForRevoke is called', () => {
                const dispatchSpy = jest.spyOn(store, 'dispatch');

                const { result } = renderUseExchangeSelectQuote();

                act(() => {
                    result.current.selectQuoteForRevoke();
                });

                expect(dispatchSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'selectQuoteThunkMock',
                        payload: expect.objectContaining({
                            quote: expect.objectContaining({
                                quoteId: mercuryoFixedBestQuote.quoteId,
                            }),
                            timer: expect.objectContaining({ timeSpent: { seconds: 0 } }),
                        }),
                    }),
                );
            });

            it('should not call selectQuoteThunk when account is not fully selected', () => {
                act(() => {
                    [
                        tradingExchangeActions.setReceiveAccountKey(
                            'btc-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                        ),
                        tradingExchangeActions.setTradingAccountKey(
                            'eth-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                        ),
                    ].forEach(store.dispatch);
                    exchangeForm.setValue('receiveAsset', btcAsset);
                });

                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const { result, reportMock } = renderUseExchangeSelectQuote();

                dispatchSpy.mockClear();
                act(() => {
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
        beforeEach(() => {
            store = getInitializedStore({ isLoading: false });

            const { result } = renderExchangeForm();
            exchangeForm = result.current;
        });

        it('should navigate to TradingExchangePreview when approval status is "approved"', () => {
            mockGetApprovalStatus.mockReturnValue('approved');

            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview', {});
            expect(dispatchSpy).not.toHaveBeenCalledWith({
                type: '@trading-exchange/savePreselectedQuote',
                payload: expect.anything(),
            });
        });

        it('should navigate to TradingExchangePreview when approval status is "not_needed"', () => {
            mockGetApprovalStatus.mockReturnValue('not_needed');

            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview', {});
        });

        it('should navigate to TradingExchangeApproval when approval status is "needs_approval"', () => {
            mockGetApprovalStatus.mockReturnValue('needs_approval');

            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeApproval', {});

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/savePreselectedQuote',
                payload: mercuryoFixedBestQuote,
            });
        });

        it('should navigate to TradingExchangeApproval with shouldIncreaseLimit when approval status is "needs_increase" and token supports increasing allowance', () => {
            mockGetApprovalStatus.mockReturnValue('needs_increase');

            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeApproval', {
                shouldIncreaseLimit: true,
            });
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: '@trading-exchange/savePreselectedQuote',
                payload: mercuryoFixedBestQuote,
            });
        });

        it('should navigate to TradingExchangeRevoke when approval status is "needs_increase" and token does not support increasing allowance', () => {
            mockGetApprovalStatus.mockReturnValue('needs_revoke');

            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedBestQuote);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeSelectQuote();
            dispatchSpy.mockClear();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeRevoke', {
                shouldIncreaseLimit: true,
            });
        });

        it.each(['needs_increase', 'needs_revoke', 'approved'])(
            'selectQuoteForRevoke should navigate to TradingExchangeRevoke with shouldIncreaseLimit: false when approval status is [%s]',
            approvalStatus => {
                mockGetApprovalStatus.mockReturnValue(approvalStatus);

                act(() => {
                    exchangeForm.setValue('quote', mercuryoFixedBestQuote);
                });

                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const { result } = renderUseExchangeSelectQuote();
                dispatchSpy.mockClear();

                act(() => {
                    result.current.selectQuoteForRevoke();
                });

                const dispatchCall = dispatchSpy.mock.calls[0][0];
                const { nextStep } = (dispatchCall as any).payload;

                act(() => {
                    nextStep();
                });

                expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangeRevoke', {
                    shouldIncreaseLimit: false,
                });
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: '@trading-exchange/savePreselectedQuote',
                    payload: mercuryoFixedBestQuote,
                });
            },
        );

        it.each(['not_needed', 'needs_approval'])(
            'selectQuoteForRevoke should not navigate when approval status is [%s]',
            approvalStatus => {
                mockGetApprovalStatus.mockReturnValue(approvalStatus);

                act(() => {
                    exchangeForm.setValue('quote', mercuryoFixedBestQuote);
                });

                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const { result } = renderUseExchangeSelectQuote();
                dispatchSpy.mockClear();

                act(() => {
                    result.current.selectQuoteForRevoke();
                });

                const dispatchCall = dispatchSpy.mock.calls[0][0];
                const { nextStep } = (dispatchCall as any).payload;

                act(() => {
                    nextStep();
                });

                expect(mockNavigation.navigate).not.toHaveBeenCalled();
            },
        );
    });
});
