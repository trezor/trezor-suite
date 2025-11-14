import { tradingSellActions } from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';
import { SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../useSellForm';
import { useSellSelectQuote } from '../useSellSelectQuote';
// Store the thunk arguments for testing
let capturedThunkArgs: any = null;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        selectQuoteThunk: (args: any) => {
            capturedThunkArgs = args;

            return () => args;
        },
    },
}));

describe('useSellSelectQuote', () => {
    let store: TestStore;
    let sellForm: SellFormType;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const renderUseSellSelectQuote = () =>
        renderHookWithStoreProviderAsync(() => useSellSelectQuote(sellForm), { store });

    beforeEach(async () => {
        store = await initStore({ wallet: getWalletState({ tradeType: 'sell' }) });

        const { result } = await renderSellForm();
        sellForm = result.current;
        capturedThunkArgs = null; // Reset before each test
    });

    describe('canProceed', () => {
        it('should be false when no quote is selected in form', async () => {
            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when quotes are being fetched', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setIsLoading(true));
            });

            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be true when quote is selected', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setTradingAccountKey('btc-account-1'));
            });

            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(true);
        });
    });

    describe('selectQuote', () => {
        it('should do nothing when no quote is selected', async () => {
            const { result } = await renderUseSellSelectQuote();

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
            const { result } = await renderUseSellSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const { userConsent } = capturedThunkArgs;

            act(() => {
                userConsent({
                    provider: 'Banxa',
                    cryptoCurrency: sellQuotes[0].cryptoCurrency,
                });
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(true);
        });

        it('should clear form quote data when quote is selected and consent is given', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                sellForm.setValue('cryptoStringAmount', '0.001');
                sellForm.setValue('fiatStringAmount', '100');
                sellForm.setValue('generalAlert', 'test error message');
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: sellQuotes[0].cryptoCurrency!,
                        amountInCrypto: sellQuotes[0].amountInCrypto!,
                        fiatCurrency: sellQuotes[0].fiatCurrency!,
                    }),
                );
            });

            const { result } = await renderUseSellSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const { userConsent, nextStep } = capturedThunkArgs;

            act(() => {
                userConsent({
                    provider: 'Banxa',
                    cryptoCurrency: sellQuotes[0].cryptoCurrency,
                });
            });

            expect(result.current.isLegalTermsConsentRequested).toEqual(true);

            // Give consent to proceed
            act(() => {
                result.current.giveLegalTermsConsent();
            });

            // Call nextStep which should clear the form data
            act(() => {
                nextStep();
            });

            // Verify form values are cleared
            expect(sellForm.watch('quote')).toBeUndefined();
            expect(sellForm.watch('cryptoStringAmount')).toBeUndefined();
            expect(sellForm.watch('fiatStringAmount')).toBeUndefined();
            expect(sellForm.watch('generalAlert')).toBeUndefined();
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
            const { result } = await renderUseSellSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const { userConsent } = capturedThunkArgs;

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
            const { result } = await renderUseSellSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const { userConsent } = capturedThunkArgs;

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
            const { result, rerender } = await renderUseSellSelectQuote();

            act(() => {
                result.current.selectQuote();
            });

            const { userConsent } = capturedThunkArgs;

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
