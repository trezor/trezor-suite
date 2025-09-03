import { useEffect } from 'react';

import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount, getEthAccount } from '../../../__fixtures__/account';
import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { ExchangeFormValues } from '../../../types/exchange';
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

    const renderUseExchangeSelectQuote = ({
        store,
        ...formValues
    }: Partial<ExchangeFormValues> & { store: TestStore }) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useExchangeForm();
                const { setValue } = form;

                useEffect(() => {
                    // Set all provided form values
                    (async () => {
                        await act(() => {
                            Object.entries(formValues).forEach(([key, value]) => {
                                setValue(key as keyof ExchangeFormValues, value);
                            });

                            return Promise.resolve();
                        });
                    })();
                }, [setValue]);

                return useExchangeSelectQuote(form);
            },
            { store },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should canProceed be false when loading', async () => {
        const store = await getInitializedStore({ isLoading: true });

        const { result } = await renderUseExchangeSelectQuote({ store });
        expect(result.current.canProceed).toBe(false);
    });

    it('should canProceed be true when not loading and quote exists', async () => {
        const store = await getInitializedStore({ isLoading: false });

        const { result } = await renderUseExchangeSelectQuote({
            store,
            quote: exchangeQuotes[1],
        });

        await act(() => Promise.resolve());

        expect(result.current.canProceed).toBe(true);
    });

    it('should handle user consent flow', async () => {
        const store = await getInitializedStore({ isLoading: false });
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        const { result } = await renderUseExchangeSelectQuote({
            store,
            quote: exchangeQuotes[2],
        });

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
        const store = await getInitializedStore({ isLoading: false });
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        const { result } = await renderUseExchangeSelectQuote({
            store,
            quote: exchangeQuotes[1],
        });

        act(() => {
            result.current.selectQuote();
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'selectQuoteThunkMock',
                payload: expect.objectContaining({
                    quote: exchangeQuotes[1],
                    timer: mockTimerReturn,
                }),
            }),
        );
    });

    it('should navigate to TradingExchangePreview when nextStep callback is executed', async () => {
        const store = await getInitializedStore({ isLoading: false });
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        const { result } = await renderUseExchangeSelectQuote({
            store,
            quote: exchangeQuotes[1],
        });

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
});
