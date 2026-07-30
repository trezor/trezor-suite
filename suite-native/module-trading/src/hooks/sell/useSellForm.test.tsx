import type { SellFiatTrade } from 'invity-api';

import { tradingSellActions } from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import {
    type TestStore,
    act,
    renderHookWithStoreProvider,
    screen,
    waitFor,
} from '@suite-native/test-utils-store';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    btcAsset,
    getBtcAccount,
    getEthAccount,
    moonpayCreditCardSellQuote,
    sellQuotes,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';
import { type SellFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useSellForm } from './useSellForm';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const eth1Account = getEthAccount({ descriptor: asAccountDescriptor('eth1normal') });

describe('useSellForm', () => {
    let store: TestStore;

    const renderUseSellForm = () => renderHookWithStoreProvider(() => useSellForm(), { store });

    const getInitializedStore = (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN) =>
        createTradingLightStore({
            tradeType: 'sell',
            overrides: {
                wallet: { settings: { bitcoinAmountUnit } },
            },
        });

    beforeEach(() => {
        store = getInitializedStore();
    });

    afterEach(() => {
        screen.unmount();
    });

    describe('sendAccount', () => {
        it('should be undefined by default', () => {
            const { result } = renderUseSellForm();

            expect(result.current.getValues('sendAccount')).toBeUndefined();
        });

        it('should update sendAccount value when account in redux store is changed', () => {
            const { result } = renderUseSellForm();

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1Account.key));
            });

            expect(result.current.getValues('sendAccount')).toEqual(btc1Account);
        });
    });

    describe('validations', () => {
        describe('cryptoStringAmount', () => {
            it.each([
                ['0.00001', 'Minimum is 0.0001 BTC'],
                ['100', 'Maximum is 50 BTC'],
                ['1', 'Insufficient funds'],
            ])('should display error for crypto amount %s BTC', async (amount, expectedValue) => {
                const { result } = renderUseSellForm();
                act(() => {
                    store.dispatch(tradingSellActions.setTradingAccountKey(btc1Account.key));
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('sendAsset', btcAsset);
                    result.current.setValue('cryptoStringAmount', amount);
                    store.dispatch(
                        tradingSellActions.setAmountLimits({
                            minCrypto: '0.0001',
                            maxCrypto: '50',
                            currency: 'BTC',
                        }),
                    );
                });

                await act(() => result.current.trigger('cryptoStringAmount'));

                const { error, invalid } = result.current.getFieldState('cryptoStringAmount');
                expect(invalid).toBe(true);
                expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
            });

            it.each([
                ['100', 'Minimum is 10,000 sat'],
                ['10000000000', 'Maximum is 5,000,000,000 sat'],
                ['10000000', 'Insufficient funds'],
            ])('should display error for crypto amount %s SATS', async (amount, expectedValue) => {
                store = getInitializedStore(PROTO.AmountUnit.SATOSHI);
                const { result } = renderUseSellForm();
                act(() => {
                    store.dispatch(tradingSellActions.setTradingAccountKey(btc1Account.key));
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('sendAsset', btcAsset);
                    result.current.setValue('cryptoStringAmount', amount);
                    store.dispatch(
                        tradingSellActions.setAmountLimits({
                            minCrypto: '0.0001',
                            maxCrypto: '50',
                            currency: 'BTC',
                        }),
                    );
                });

                await act(() => result.current.trigger('cryptoStringAmount'));

                const { error, invalid } = result.current.getFieldState('cryptoStringAmount');
                expect(invalid).toBe(true);
                expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
            });

            it.each<[string, boolean]>([
                ['1', false],
                ['2', true],
            ])(
                'should use correct balance for USDC and amount %s',
                async (amount, expectedInvalid) => {
                    const { result } = renderUseSellForm();
                    act(() => {
                        store.dispatch(tradingSellActions.setTradingAccountKey(eth1Account.key));
                        result.current.setValue('amountInCrypto', true);
                        result.current.setValue('sendAsset', usdcAsset);
                        result.current.setValue('cryptoStringAmount', amount);
                    });

                    await act(() => result.current.trigger('cryptoStringAmount'));

                    const { invalid } = result.current.getFieldState('cryptoStringAmount');
                    expect(invalid).toBe(expectedInvalid);
                },
            );

            it("should be validated once the quote is selected and it changes it's value", async () => {
                const { result } = renderUseSellForm();
                act(() => {
                    store.dispatch(tradingSellActions.setTradingAccountKey(eth1Account.key));
                    result.current.setValue('amountInCrypto', false);
                    result.current.setValue('sendAsset', usdcAsset);
                    result.current.setValue('fiatStringAmount', '100');
                });

                await act(async () => {
                    result.current.setValue('quote', {
                        ...banxaCreditCardSellQuote,
                        cryptoStringAmount: '2',
                    });
                    // settle validations
                    await Promise.resolve();
                });

                const { invalid, error } = result.current.getFieldState('cryptoStringAmount');
                expect(invalid).toBe(true);
                expect(error).toEqual(
                    expect.objectContaining({
                        message: 'Insufficient funds',
                        type: 'insufficient-balance',
                    }),
                );
            });
        });

        describe('fiatStringAmount', () => {
            it.each([
                ['10', 'Minimum is $1,000.00'],
                ['3000', 'Maximum is $2,000.00'],
            ])('should display fiat error for amount %s', async (amount, expectedValue) => {
                const { result } = renderUseSellForm();
                act(() => {
                    store.dispatch(tradingSellActions.setTradingAccountKey(btc1Account.key));
                    result.current.setValue('amountInCrypto', false);
                    result.current.setValue('sendAsset', btcAsset);
                    result.current.setValue('fiatStringAmount', amount);
                    store.dispatch(
                        tradingSellActions.setAmountLimits({
                            minFiat: '1000',
                            maxFiat: '2000',
                            currency: 'USD',
                        }),
                    );
                });

                await act(() => result.current.trigger('fiatStringAmount'));

                const { error, invalid } = result.current.getFieldState('fiatStringAmount');
                expect(invalid).toBe(true);
                expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
            });
        });

        it('should trigger validation once limits are loaded', async () => {
            act(() => {
                store.dispatch(tradingSellActions.setAmountLimits(undefined));
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1Account.key));
            });
            const { result } = renderUseSellForm();
            act(() => {
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('cryptoStringAmount', '10');
            });

            act(() => {
                store.dispatch(
                    tradingSellActions.setAmountLimits({ maxCrypto: '5', currency: 'BTC' }),
                );
            });

            await waitFor(() => {
                const { invalid } = result.current.getFieldState('cryptoStringAmount');
                expect(invalid).toBe(true);
            });
        });

        describe('generalAlert', () => {
            it('should be undefined by default', () => {
                const { result } = renderUseSellForm();

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes([] as SellFiatTrade[]));
                    store.dispatch(tradingSellActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be set when empty quotes are fetched and no limits are set', () => {
                const { result } = renderUseSellForm();

                act(() => {
                    store.dispatch(
                        tradingSellActions.saveQuoteRequest({
                            cryptoCurrency: btcAsset.cryptoId,
                            amountInCrypto: true,
                            fiatCurrency: 'USD',
                        }),
                    );
                    store.dispatch(tradingSellActions.saveQuotes([] as SellFiatTrade[]));
                    store.dispatch(tradingSellActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toEqual(
                    'No offers found. Adjust the currency, assets, or amounts.',
                );
            });

            it('should be undefined when empty quotes are fetched and limits are set', () => {
                const { result } = renderUseSellForm();

                act(() => {
                    store.dispatch(
                        tradingSellActions.saveQuoteRequest({
                            cryptoCurrency: btcAsset.cryptoId,
                            amountInCrypto: true,
                            fiatCurrency: 'USD',
                        }),
                    );
                    store.dispatch(tradingSellActions.saveQuotes([] as SellFiatTrade[]));
                    store.dispatch(
                        tradingSellActions.setAmountLimits({
                            currency: 'BTC',
                            minCrypto: '0.0001',
                        }),
                    );
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be undefined once quotes are fetched', () => {
                const { result } = renderUseSellForm();

                act(() => {
                    store.dispatch(
                        tradingSellActions.saveQuoteRequest({
                            cryptoCurrency: btcAsset.cryptoId,
                            amountInCrypto: true,
                            fiatCurrency: 'USD',
                        }),
                    );
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                    store.dispatch(tradingSellActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be cleared once quotes are fetched', () => {
                const { result } = renderUseSellForm();

                act(() => {
                    store.dispatch(
                        tradingSellActions.saveQuoteRequest({
                            cryptoCurrency: btcAsset.cryptoId,
                            amountInCrypto: true,
                            fiatCurrency: 'USD',
                        }),
                    );
                    store.dispatch(tradingSellActions.saveQuotes([] as SellFiatTrade[]));
                    store.dispatch(tradingSellActions.setAmountLimits(undefined));
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });
        });
    });

    describe('on quotes change', () => {
        const initFormAndQuoteRequest = (form: SellFormType) => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('sendAccount', btc1Account);
                form.setValue('amountInCrypto', false);
                form.setValue('fiatStringAmount', '10');
            });
            act(() => {
                store.dispatch(
                    tradingSellActions.saveQuoteRequest({
                        cryptoCurrency: btcAsset.cryptoId,
                        amountInCrypto: true,
                        fiatCurrency: 'USD',
                    }),
                );
            });
        };

        it('if no quote is selected should select best rated quote with bankTransfer payment method', () => {
            const { result } = renderUseSellForm();

            initFormAndQuoteRequest(result.current);
            act(() => {
                store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
            });

            expect(result.current.getValues('quote')).toEqual(banxaBankTransferSellQuote);
        });

        it('if no quote is selected and no bankTransferQuote is available should select first quote', () => {
            const { result } = renderUseSellForm();
            initFormAndQuoteRequest(result.current);

            act(() => {
                store.dispatch(
                    tradingSellActions.saveQuotes([
                        banxaCreditCardSellQuote,
                        moonpayCreditCardSellQuote,
                    ]),
                );
            });

            expect(result.current.getValues('quote')).toEqual(banxaCreditCardSellQuote);
        });

        describe('when quote is selected and new quotes are fetched', () => {
            it('should set quote to undefined when no quotes are available', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);

                act(() => {
                    result.current.setValue('quote', banxaCreditCardSellQuote);
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes([]));
                });

                expect(result.current.getValues('quote')).toBeUndefined();
            });

            it('should select quote with same payment method and provider', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);

                act(() => {
                    result.current.setValue('quote', {
                        ...moonpayCreditCardSellQuote,
                        orderId: 'test1',
                    });
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                });

                expect(result.current.getValues('quote')).toEqual(moonpayCreditCardSellQuote);
            });

            it('should select quote with same payment method if provider is not available', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);

                act(() => {
                    result.current.setValue('quote', {
                        ...moonpayCreditCardSellQuote,
                        orderId: 'test1',
                    });
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes.slice(0, 2)));
                });

                expect(result.current.getValues('quote')).toEqual(banxaCreditCardSellQuote);
            });

            it('should select best rated quote if neither same payment method nor provider are available', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);

                act(() => {
                    result.current.setValue('quote', {
                        ...moonpayCreditCardSellQuote,
                        orderId: 'test1',
                    });
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes([banxaBankTransferSellQuote]));
                });

                expect(result.current.getValues('quote')).toEqual(banxaBankTransferSellQuote);
            });

            it('should update cryptoValue when selected quote is changed and truncate it to 9 decimals', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);
                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                });

                act(() => {
                    result.current.setValue('quote', banxaBankTransferSellQuote);
                });

                expect(result.current.getValues('cryptoStringAmount')).toBe('0.025396001');
            });
            it('should update fiatAmount when selected quote is changed and user inserted cryptoAmount and truncate it to 3 decimals', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);
                act(() => {
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('cryptoStringAmount', '0.1');
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                });

                act(() => {
                    result.current.setValue('quote', moonpayCreditCardSellQuote);
                });

                expect(result.current.getValues('fiatStringAmount')).toBe('100.062');
            });

            it('should clear cryptoValue when no quotes are available and user inserted fiatValue', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);
                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes([]));
                });

                expect(result.current.getValues('cryptoStringAmount')).toBeUndefined();
                expect(result.current.getValues('fiatStringAmount')).toBe('10');
            });

            it('should clear fiatValue when no quotes are available and user inserted cryptoValue', () => {
                const { result } = renderUseSellForm();
                initFormAndQuoteRequest(result.current);
                act(() => {
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('cryptoStringAmount', '0.1');
                    store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
                });

                act(() => {
                    store.dispatch(tradingSellActions.saveQuotes([]));
                });

                expect(result.current.getValues('fiatStringAmount')).toBeUndefined();
                expect(result.current.getValues('cryptoStringAmount')).toBe('0.1');
            });
        });
    });

    describe('on country change', () => {
        it('should set country to redux on change', () => {
            const { result } = renderUseSellForm();

            act(() => {
                result.current.setValue('country', {
                    value: 'CA',
                    label: '🇨🇦 Canada',
                    shortLabel: '🇨🇦 CAN',
                    codeAlpha3: 'CAN',
                    flag: '🇨🇦',
                    name: 'Canada',
                });
            });

            expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
        });
    });
});
