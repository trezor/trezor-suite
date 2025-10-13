import { tradingSellActions } from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { getWalletState } from '../../../__fixtures__/walletState';
import { SellFormType } from '../../../types/sell';
import { useSellFlow } from '../useSellFlow';
import { useSellForm } from '../useSellForm';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
        }),
        handleTradeThunk: (payload: unknown) => ({
            type: 'handleTradeThunkMock',
            payload,
        }),
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
        }),
    },
}));

describe('useSellFlow', () => {
    let store: TestStore;
    let sellForm: SellFormType;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const renderUseSellFlow = () =>
        renderHookWithStoreProviderAsync(() => useSellFlow(sellForm), { store });

    beforeEach(async () => {
        store = await initStore({ wallet: getWalletState({ tradeType: 'sell' }) });

        const { result } = await renderSellForm();
        sellForm = result.current;
    });

    describe('canProceed', () => {
        it('should be false when no quote is selected in form', async () => {
            const { result } = await renderUseSellFlow();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when quotes are being fetched', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setIsLoading(true));
            });

            const { result } = await renderUseSellFlow();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be true when quote is selected', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setTradingAccountKey('btc-account-1'));
            });

            const { result } = await renderUseSellFlow();

            expect(result.current.canProceed).toEqual(true);
        });
    });

    describe('selectQuote', () => {
        it('should do nothing when no quote is selected', async () => {
            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(false);
        });

        it('should request consent', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: sellQuotes[0].cryptoCurrency!,
                        amountInCrypto: sellQuotes[0].amountInCrypto!,
                        fiatCurrency: sellQuotes[0].fiatCurrency!,
                    }),
                );
            });
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { userConsent } = dispatchCall.payload;

            act(() => {
                userConsent({
                    provider: 'Banxa',
                    cryptoCurrency: sellQuotes[0].cryptoCurrency,
                });
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(true);
        });
    });

    describe('giveConsent', () => {
        beforeEach(() => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: sellQuotes[0].cryptoCurrency!,
                        amountInCrypto: sellQuotes[0].amountInCrypto!,
                        fiatCurrency: sellQuotes[0].fiatCurrency!,
                    }),
                );
            });
        });

        it('should resolve consent', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { userConsent } = dispatchCall.payload;

            act(() => {
                userConsent({
                    provider: 'Banxa',
                    cryptoCurrency: sellQuotes[0].cryptoCurrency,
                });
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(true);

            act(() => {
                result.current.giveLegalTermsConsent();
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(false);
        });
    });

    describe('cancelConsent', () => {
        beforeEach(() => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: sellQuotes[0].cryptoCurrency!,
                        amountInCrypto: sellQuotes[0].amountInCrypto!,
                        fiatCurrency: sellQuotes[0].fiatCurrency!,
                    }),
                );
            });
        });

        it('should resolve consent (with false value)', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { userConsent } = dispatchCall.payload;

            act(() => {
                userConsent({
                    provider: 'Banxa',
                    cryptoCurrency: sellQuotes[0].cryptoCurrency,
                });
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(true);

            act(() => {
                result.current.cancelLegalTermsConsent();
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(false);
        });

        it('should reset consent when quote provider changes', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result, rerender } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            const dispatchCall = dispatchSpy.mock.calls[0][0];
            const { userConsent } = dispatchCall.payload;

            act(() => {
                userConsent({
                    provider: 'Banxa',
                    cryptoCurrency: sellQuotes[0].cryptoCurrency,
                });
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(true);

            // Change quote to one with different provider
            act(() => {
                sellForm.setValue('quote', { ...sellQuotes[0], exchange: 'invity-sell' });
            });
            rerender({});

            expect(result.current.isLegalTermsConsentRequested).toEqual(false);
        });
    });
});
