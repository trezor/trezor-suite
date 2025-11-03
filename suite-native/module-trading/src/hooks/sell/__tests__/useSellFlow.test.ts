import { tradingSellActions } from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { SellFormType } from '@suite-native/trading-types';

import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useSellFlow } from '../useSellFlow';
import { useSellForm } from '../useSellForm';

// Store the thunk arguments for testing
let capturedThunkArgs: any = null;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        selectQuoteThunk: (args: any) => {
            capturedThunkArgs = args;

            return () => args;
        },
        handleTradeThunk: (args: unknown) => () => args,
        confirmTradeThunk: (args: unknown) => () => args,
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
        capturedThunkArgs = null; // Reset before each test
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
            const { result } = await renderUseSellFlow();

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
            const { result } = await renderUseSellFlow();

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
            const { result } = await renderUseSellFlow();

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
            const { result, rerender } = await renderUseSellFlow();

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

    describe('Form Step Logic', () => {
        it('should set form step to BANK_ACCOUNT when provider flow is BANK_ACCOUNT', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            act(() => {
                sellForm.setValue('quote', sellQuotes[1]); // banxa-sell provider with BANK_ACCOUNT flow
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: sellQuotes[1].cryptoCurrency!,
                        amountInCrypto: sellQuotes[1].amountInCrypto!,
                        fiatCurrency: sellQuotes[1].fiatCurrency!,
                    }),
                );
            });

            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            // Check that setFormStep was called with BANK_ACCOUNT
            expect(dispatchSpy).toHaveBeenCalledWith(
                tradingSellActions.setFormStep('BANK_ACCOUNT'),
            );
        });

        it('should set form step to SEND_TRANSACTION when provider flow is not BANK_ACCOUNT', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            // Create a quote with a provider that doesn't have BANK_ACCOUNT flow
            const customQuote = {
                ...sellQuotes[0],
                exchange: 'custom-provider', // This provider won't be in providerInfos
            };

            act(() => {
                sellForm.setValue('quote', customQuote);
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: customQuote.cryptoCurrency!,
                        amountInCrypto: customQuote.amountInCrypto!,
                        fiatCurrency: customQuote.fiatCurrency!,
                    }),
                );
            });

            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            // Check that setFormStep was called with SEND_TRANSACTION
            expect(dispatchSpy).toHaveBeenCalledWith(
                tradingSellActions.setFormStep('SEND_TRANSACTION'),
            );
        });
    });
});
