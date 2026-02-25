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
    exchangeQuotes,
    getBtcAccount,
    getEthAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../useExchangeForm';
import { useExchangeSelectQuote } from '../useExchangeSelectQuote';

const mockTokenSupportsIncreasingAllowance = jest.fn();
const mockGetApprovalStatus = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
        }),
    },
    tokenSupportsIncreasingAllowance: (contractAddress?: string) =>
        mockTokenSupportsIncreasingAllowance(contractAddress),
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

    const getInitializedStore = ({ isLoading }: { isLoading?: boolean }) => {
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
    });

    describe('with quote loaded and selected', () => {
        beforeEach(() => {
            store = getInitializedStore({ isLoading: false });

            const { result } = renderExchangeForm();
            exchangeForm = result.current;

            act(() => {
                exchangeForm.setValue('quote', exchangeQuotes[1]);
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
                        quote: expect.objectContaining({ quoteId: exchangeQuotes[1]?.quoteId }),
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
                exchangeForm.setValue('quote', exchangeQuotes[1]);
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
                exchangeForm.setValue('quote', exchangeQuotes[1]);
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
                exchangeForm.setValue('quote', exchangeQuotes[1]);
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
                payload: exchangeQuotes[1],
            });
        });

        it('should navigate to TradingExchangeApproval with shouldIncreaseLimit when approval status is "needs_increase" and token supports increasing allowance', () => {
            mockGetApprovalStatus.mockReturnValue('needs_increase');
            mockTokenSupportsIncreasingAllowance.mockReturnValue(true);

            act(() => {
                exchangeForm.setValue('quote', exchangeQuotes[1]);
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
                payload: exchangeQuotes[1],
            });
        });

        it('should navigate to TradingExchangeRevoke when approval status is "needs_increase" and token does not support increasing allowance', () => {
            mockGetApprovalStatus.mockReturnValue('needs_increase');
            mockTokenSupportsIncreasingAllowance.mockReturnValue(false);

            act(() => {
                exchangeForm.setValue('quote', exchangeQuotes[1]);
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
                quote: exchangeQuotes[1],
                shouldIncreaseLimit: true,
            });
        });
    });
});
