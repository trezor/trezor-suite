import { tradingExchangeActions, tradingSettingsActions } from '@suite-common/trading';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount, getEthAccount } from '../../../__fixtures__/account';
import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { ExchangeFormType } from '../../../types/exchange';
import { useExchangeForm } from '../useExchangeForm';
import { useExchangeSelectQuote } from '../useExchangeSelectQuote';

const mockTimerReturn = {
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    isRunning: false,
};

jest.mock('@trezor/react-utils', () => ({
    useTimer: () => mockTimerReturn,
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
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

describe('useExchangeSelectQuote', () => {
    let exchangeForm: ExchangeFormType;
    let store: TestStore;

    const getInitializedStore = async ({ isLoading }: { isLoading?: boolean }) => {
        const btcAccount = getBtcAccount('btc-account-key');
        const ethAccount = getEthAccount('eth-account-key');

        const preloadedState: PreloadedState = {
            wallet: {
                trading: getInitializedTradingStateWithQuotes(),
                accounts: [btcAccount, ethAccount],
            },
        };
        if (isLoading !== undefined) {
            preloadedState.wallet!.trading!.exchange!.isLoading = isLoading;
        }
        // Ensure required keys are present so the hook can proceed
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'btc-account-key';
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = 'eth-account-key';

        return await initStore(preloadedState);
    };

    const renderExchangeForm = () =>
        renderHookWithStoreProviderAsync(() => useExchangeForm(), { store });

    const renderUseExchangeSelectQuote = () =>
        renderHookWithStoreProviderAsync(() => useExchangeSelectQuote(exchangeForm), { store });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('while loading quotes', () => {
        beforeEach(async () => {
            store = await getInitializedStore({ isLoading: true });

            const { result } = await renderExchangeForm();
            exchangeForm = result.current;
        });

        it('should canProceed be false when loading', async () => {
            const { result } = await renderUseExchangeSelectQuote();
            expect(result.current.canProceed).toBe(false);
        });
    });

    describe('with quote loaded and selected', () => {
        beforeEach(async () => {
            store = await getInitializedStore({ isLoading: false });

            const { result } = await renderExchangeForm();
            exchangeForm = result.current;

            act(() => {
                exchangeForm.setValue('quote', exchangeQuotes[1]);
            });
        });

        it('should canProceed be true when not loading and quote exists', async () => {
            const { result } = await renderUseExchangeSelectQuote();

            await act(() => Promise.resolve());

            expect(result.current.canProceed).toBe(true);
        });

        it('should handle user consent flow', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { userConsent } = (dispatchCall as any).payload;

            act(() => {
                userConsent('provider', 'BTC', 'ETH');
            });

            expect(result.current.isConsentRequested).toBe(true);

            act(() => {
                result.current.giveConsent();
            });

            expect(result.current.isConsentRequested).toBe(false);
        });

        it('should call selectQuoteThunk when selectQuote is called', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'selectQuoteThunkMock',
                    payload: expect.objectContaining({
                        quote: expect.objectContaining({ quoteId: exchangeQuotes[1]?.quoteId }),
                        timer: mockTimerReturn,
                    }),
                }),
            );
        });

        it('should call selectQuoteThunk with correct maxSlippage value', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            act(() => {
                store.dispatch(tradingSettingsActions.setMaxSlippagePercentage('1.5'));
            });
            const { result } = await renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'selectQuoteThunkMock',
                    payload: expect.objectContaining({
                        quote: expect.objectContaining({ swapSlippage: '1.5' }),
                        timer: mockTimerReturn,
                    }),
                }),
            );
        });

        it('should not call selectQuoteThunk when account is not fully selected', async () => {
            act(() => {
                [
                    tradingExchangeActions.setReceiveAccountKey('btc-account-key'),
                    tradingExchangeActions.setTradingAccountKey('eth-account-key'),
                ].forEach(store.dispatch);
                exchangeForm.setValue('receiveAsset', btcAsset);
            });

            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeSelectQuote();

            dispatchSpy.mockClear();
            act(() => {
                result.current.selectQuote();
            });

            expect(dispatchSpy).not.toHaveBeenCalled();
            expect(mockNavigation.navigate).toHaveBeenCalledWith('ReceiveAccounts', {
                symbol: 'btc',
                tradingType: 'exchange',
            });
        });

        it('should navigate to TradingExchangePreview when nextStep callback is executed', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { nextStep } = (dispatchCall as any).payload;

            // Execute the nextStep callback to simulate successful quote selection
            act(() => {
                nextStep();
            });

            expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingExchangePreview');
        });

        it('should call cancelConsent when quote provider changes', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result, rerender } = await renderUseExchangeSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            // simulate userConsent call (as we mock the thunk)
            const { userConsent } = (dispatchCall as any).payload;
            act(() => {
                userConsent();
            });
            expect(result.current.isConsentRequested).toBe(true);

            // change selected quote to quote with different provider
            act(() => {
                exchangeForm.setValue('quote', { ...exchangeQuotes[1], exchange: 'invity' });
            });

            // we need to manually rerender tested hook
            rerender({});

            // consent should not be requested anymore
            expect(result.current.isConsentRequested).toBe(false);
        });
    });
});
