import { useEffect } from 'react';

import { ExchangeTrade } from 'invity-api';

import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { ExchangeFormValues } from '../../../types/exchange';
import { getApprovalStatus, useExchangeFlow } from '../useExchangeFlow';
import { useExchangeForm } from '../useExchangeForm';

// Mock the exchange thunks
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
        }),
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
        }),
    },
}));

// Mock timer
jest.mock('@trezor/react-utils', () => ({
    useTimer: () => ({
        start: jest.fn(),
        stop: jest.fn(),
    }),
}));

describe('useExchangeFlow', () => {
    const getInitializedStore = async ({
        isLoading,
        selectedQuote,
        sendAccountKey,
        receiveAccountKey,
    }: {
        isLoading?: boolean;
        selectedQuote?: ExchangeTrade;
        sendAccountKey?: string;
        receiveAccountKey?: string;
    }) => {
        const preloadedState: PreloadedState = {
            wallet: {
                tradingNew: getInitializedTradingStateWithQuotes(),
                accounts: [
                    {
                        key: 'btc-account-key',
                        symbol: 'btc',
                        addresses: {
                            unused: [{ address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' }],
                        },
                        descriptor: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                    },
                    {
                        key: 'eth-account-key',
                        symbol: 'eth',
                        addresses: {
                            unused: [{ address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' }],
                        },
                        descriptor: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                    },
                ],
            },
        };

        if (isLoading !== undefined) {
            preloadedState.wallet!.tradingNew!.exchange!.isLoading = isLoading;
        }

        preloadedState.wallet!.tradingNew!.exchange!.selectedQuote = selectedQuote;

        preloadedState.wallet!.tradingNew!.exchange!.tradingAccountKey = sendAccountKey;

        preloadedState.wallet!.tradingNew!.exchange!.receiveAccountKey = receiveAccountKey;

        return await initStore(preloadedState);
    };

    const renderUseTradingExchangeFlow = ({
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

                return useExchangeFlow(form);
            },
            { store },
        );

    it('should canProceed be false when loading', async () => {
        const store = await getInitializedStore({ isLoading: true });

        const { result } = await renderUseTradingExchangeFlow({ store });
        expect(result.current.canProceed).toBe(false);
    });

    it('should canProceed be false when no send account key', async () => {
        const store = await getInitializedStore({
            isLoading: false,
            sendAccountKey: undefined,
        });

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: exchangeQuotes[1],
        });

        expect(result.current.canProceed).toBe(false);
    });

    it('should canProceed be true when not loading and quote is available', async () => {
        const store = await getInitializedStore({
            isLoading: false,
            sendAccountKey: 'btc-account-key',
        });

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: exchangeQuotes[1],
        });

        expect(result.current.canProceed).toBe(true);
    });

    it('should return correct approval status for approved quote', async () => {
        const approvedQuote = {
            ...exchangeQuotes[1],
            preapprovedStringAmount: '0.001',
        };

        const store = await getInitializedStore({ isLoading: false });

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: approvedQuote,
        });

        expect(result.current.approvalStatus).toBe('approved');
    });

    it('should return correct approval status for DEX quote', async () => {
        const dexQuote = {
            ...exchangeQuotes[1],
            isDex: true,
        };

        const store = await getInitializedStore({ isLoading: false });

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: dexQuote,
        });

        expect(result.current.approvalStatus).toBe('needs_approval');
    });

    it('should return correct approval status for regular quote', async () => {
        const regularQuote = {
            ...exchangeQuotes[1],
            preapprovedStringAmount: undefined,
            isDex: false,
        };

        const store = await getInitializedStore({ isLoading: false });

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: regularQuote,
        });

        expect(result.current.approvalStatus).toBe('not_needed');
    });

    it('should handle user consent flow', async () => {
        const store = await getInitializedStore({
            isLoading: false,
            sendAccountKey: 'btc-account-key',
            receiveAccountKey: 'eth-account-key',
        });
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: exchangeQuotes[1],
        });

        act(() => {
            result.current.selectQuote();
        });

        const dispatchCall = dispatchSpy.mock.calls[0][0];
        const { userConsent } = dispatchCall.payload;

        act(() => {
            userConsent();
        });

        expect(result.current.isConsentRequested).toBe(true);

        act(() => {
            result.current.giveConsent();
        });

        expect(result.current.isConsentRequested).toBe(false);
    });
});

describe('getApprovalStatus', () => {
    it('should return null when no quote is provided', () => {
        const result = getApprovalStatus(undefined);
        expect(result).toBe(null);
    });

    it('should return "approved" when quote has preapprovedStringAmount', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
        };

        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "needs_approval" when quote is DEX', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            preapprovedStringAmount: undefined,
        };

        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "not_needed" for regular quotes', () => {
        const quote = {
            orderId: 'test-order',
            isDex: false,
            preapprovedStringAmount: undefined,
        };

        const result = getApprovalStatus(quote);
        expect(result).toBe('not_needed');
    });

    it('should prioritize preapprovedStringAmount over isDex', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            preapprovedStringAmount: '0.001',
        };

        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });
});
