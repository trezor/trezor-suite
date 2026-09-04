import { Platform } from 'react-native';

import { type EnhancedStore } from '@reduxjs/toolkit';
import type { BuyTrade, CryptoId } from 'invity-api';

import { selectTradingProviderMetadata, tradingBuyActions } from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    type TestStore,
    act,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    btc2legacyAccount,
    btcAsset,
    buyMercuryo,
    buyQuotes,
    cexdirectCreditCardBuyQuote,
    eth1NormalAccount,
    eth2legacyAccount,
    ethAsset,
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
    mercuryoCreditCardBuyQuote,
} from '@suite-native/trading-fixtures';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';
import { type BuyFormType, type TradeableAsset } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { clearBuyFormQuoteData, useBuyForm } from './useBuyForm';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) => fn(),
    };
});

const btc1AccountKey = btc1NormalAccount.key;
const btc2AccountKey = btc2legacyAccount.key;
const accountDeviceState = btc1NormalAccount.deviceState;

describe('useBuyForm', () => {
    const renderUseTradingBuyForm = async (store: TestStore) =>
        await renderHookWithStoreProvider(() => useBuyForm(), { store });

    const getInitializedStore = (amountInSats = false) => {
        const tradingState = getInitializedTradingState();
        tradingState.buy.tradingAccountKey = btc1AccountKey;

        return createTradingLightStore({
            overrides: {
                device: {
                    selectedDevice: {
                        state: {
                            staticSessionId: accountDeviceState,
                        },
                    },
                },
                wallet: {
                    trading: tradingState,
                    settings: {
                        bitcoinAmountUnit: amountInSats
                            ? PROTO.AmountUnit.SATOSHI
                            : PROTO.AmountUnit.BITCOIN,
                    },
                    accounts: [
                        btc1NormalAccount,
                        btc2legacyAccount,
                        eth1NormalAccount,
                        eth2legacyAccount,
                    ],
                },
            },
        });
    };

    const initFormAndQuotes = async (form: BuyFormType, store: EnhancedStore) => {
        await act(() => {
            form.setValue('fiatValue', '10');
            form.setValue('asset', btcAsset);
        });

        await act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve({}),
                ok: true,
            }),
        );
    });

    it('should update form value when account in redux store is changed', async () => {
        const store = getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        await act(() => {
            store.dispatch(tradingBuyActions.setTradingAccountKey(btc2AccountKey));
        });

        expect(result.current.getValues('receiveAccount')).toEqual({
            account: expect.objectContaining({ key: btc2AccountKey }),
        });
    });

    it('should preselect receiveAccount when asset is selected', async () => {
        const store = getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        await act(() => {
            result.current.setValue('asset', btcAsset);
        });

        await waitFor(() => {
            expect(result.current.getValues('receiveAccount')).toEqual(
                expect.objectContaining({
                    account: expect.objectContaining({ key: btc1AccountKey }),
                }),
            );
        });
    });

    it('should not clear selected account when asset is set to undefined', async () => {
        const store = getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        await act(() => {
            store.dispatch(tradingBuyActions.setTradingAccountKey(btc1AccountKey));
            result.current.setValue('asset', undefined as unknown as TradeableAsset);
        });

        expect(result.current.getValues('receiveAccount')).toEqual({
            account: expect.objectContaining({ key: btc1AccountKey }),
        });
    });

    describe('on quotes change', () => {
        it.each<[string, string]>([
            ['ios', 'applePay'],
            ['android', 'googlePay'],
            ['web', 'creditCard'],
        ])(
            'if no quote is selected should select 1st quote with %s payment method based on %s',
            async (platform, method) => {
                jest.spyOn(Platform, 'select').mockImplementation(
                    (option: any) => option[platform],
                );

                const store = getInitializedStore();
                const { result } = await renderUseTradingBuyForm(store);

                await initFormAndQuotes(result.current, store);

                expect(result.current.getValues('quote')).toEqual(
                    expect.objectContaining({
                        paymentMethod: method,
                    }),
                );

                jest.restoreAllMocks();
            },
        );

        it('if no quote is selected and preferred method is not available should select 1st quote with credit card', async () => {
            jest.spyOn(Platform, 'select').mockImplementation((option: any) => option['ios']);
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
                result.current.setValue('fiatValue', '10');
                result.current.setValue('asset', btcAsset);
                // Only provide credit card quote
                store.dispatch(tradingBuyActions.saveQuotes([mercuryoApplePayBuyQuote]));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    paymentMethod: 'applePay',
                    exchange: 'mercuryo',
                }),
            );
            jest.restoreAllMocks();
        });

        it('should set quote to undefined when no quotes are available', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            await initFormAndQuotes(result.current, store);

            await act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('quote')).toBeUndefined();
        });

        it('should clear cryptoValue when no quotes are available', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            await initFormAndQuotes(result.current, store);

            await act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('cryptoValue')).toBeUndefined();
            expect(result.current.getValues('fiatValue')).toBe('10');
        });

        it('should clear fiatValue when no quotes are available and user inserted cryptoValue', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            await act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcAsset);
                result.current.setValue('cryptoValue', '1');
                store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            });

            await act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('fiatValue')).toBeUndefined();
            expect(result.current.getValues('cryptoValue')).toBe('1');
        });

        it('should update cryptoValue when selected quote is changed and truncate it to 9 decimals', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            await initFormAndQuotes(result.current, store);

            await act(() => {
                result.current.setValue('quote', mercuryoApplePayBuyQuote);
            });

            expect(result.current.getValues('cryptoValue')).toEqual('0.001000168');
            expect(result.current.getValues('fiatValue')).toEqual('10');
        });

        it('should not update cryptoValue from a quote for a different asset', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            await initFormAndQuotes(result.current, store);

            await act(() => {
                result.current.setValue('asset', ethAsset);
                result.current.setValue('cryptoValue', undefined);
            });

            expect(result.current.getValues('cryptoValue')).toBeUndefined();
        });

        it('should update fiatAmount when selected quote is changed and user inserted cryptoAmount and truncate it to 3 decimals', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
                result.current.setValue('asset', btcAsset);
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('cryptoValue', '100');
                store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            });

            await act(() => {
                const newQuote = {
                    ...mercuryoApplePayBuyQuote,
                    fiatStringAmount: '10.123456789',
                } as BuyTrade;
                result.current.setValue('quote', newQuote);
            });

            expect(result.current.getValues('cryptoValue')).toEqual('100');
            expect(result.current.getValues('fiatValue')).toEqual('10.123');
        });

        it('should persist provider metadata to redux', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            await initFormAndQuotes(result.current, store);

            await act(() => {
                result.current.setValue('quote', mercuryoApplePayBuyQuote);
            });

            expect(selectTradingProviderMetadata(store.getState())).toEqual(buyMercuryo);
        });

        describe('when quote is selected and new quotes are fetched', () => {
            let store: EnhancedStore;
            let form: BuyFormType;

            beforeEach(async () => {
                store = getInitializedStore();
                const { result } = await renderUseTradingBuyForm(store);
                form = result.current;

                await act(() => {
                    result.current.setValue('asset', btcAsset);
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('cryptoValue', '100');
                });
            });

            it('should select quote with same payment method and provider', async () => {
                await act(() => {
                    form.setValue('quote', {
                        ...mercuryoCreditCardBuyQuote,
                        orderId: 'test1',
                    } as BuyTrade);
                });

                await act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                expect(form.getValues('quote')).toEqual(mercuryoCreditCardBuyQuote);
            });

            it('should select 1st quote with same payment method if same provider is not available', async () => {
                await act(() => {
                    form.setValue('quote', {
                        ...mercuryoCreditCardBuyQuote,
                        orderId: 'test1',
                        exchange: 'unavailable',
                    } as BuyTrade);
                });

                await act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                expect(form.getValues('quote')).toEqual(cexdirectCreditCardBuyQuote);
            });

            it('should select 1st quote on new quotes when payment method is not available even with different provider', async () => {
                await act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                await act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes([mercuryoApplePayBuyQuote]));
                });

                expect(form.getValues('quote')).toEqual(
                    expect.objectContaining({
                        paymentMethod: 'applePay',
                    }),
                );
            });
        });
    });

    it('should set correct cryptoValue when using BTC and amount in sats', async () => {
        const store = getInitializedStore(true);
        const { result } = await renderUseTradingBuyForm(store);

        await initFormAndQuotes(result.current, store);

        expect(result.current.getValues('cryptoValue')).toEqual('100016.8');
    });

    describe('validations', () => {
        it.each([
            ['10', 'Minimum is $1,000.00'],
            ['3000', 'Maximum is $2,000.00'],
        ])('should display fiat error for amount %s', async (amount, expectedValue) => {
            const store = getInitializedStore(true);

            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
                result.current.setValue('fiatValue', amount);
                result.current.setValue('asset', btcAsset);
            });

            await act(() => {
                store.dispatch(
                    tradingBuyActions.setAmountLimits({
                        minFiat: '1000',
                        maxFiat: '2000',
                        currency: 'USD',
                    }),
                );
            });

            await act(() => result.current.trigger('fiatValue'));

            const { error, invalid } = result.current.getFieldState('fiatValue');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it.each([
            ['0.01', false, 'Minimum is 0.1 BTC'],
            ['3', false, 'Maximum is 2 BTC'],
            ['10', true, 'Minimum is 10,000,000 sat'],
            ['300000000', true, 'Maximum is 200,000,000 sat'],
        ])(
            'should display crypto error for amount %s',
            async (amount, amountInSats, expectedValue) => {
                const store = getInitializedStore(amountInSats);
                const { result } = await renderUseTradingBuyForm(store);

                await act(() => {
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('asset', btcAsset);
                });
                await act(() => {
                    store.dispatch(
                        tradingBuyActions.setAmountLimits({
                            minCrypto: '0.1',
                            maxCrypto: '2',
                            currency: 'BTC',
                        }),
                    );
                });
                await act(() => {
                    result.current.setValue('cryptoValue', amount);
                });

                await act(() => result.current.trigger('cryptoValue'));

                const { error, invalid } = result.current.getFieldState('cryptoValue');

                expect(invalid).toBe(true);
                expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
            },
        );

        it('should correctly compute limits with SATS', async () => {
            const store = getInitializedStore(true);
            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcAsset);
            });
            await act(() => {
                store.dispatch(
                    tradingBuyActions.setAmountLimits({
                        minCrypto: '0.1',
                        maxCrypto: '2',
                        currency: 'BTC',
                    }),
                );
            });
            await act(() => {
                result.current.setValue('cryptoValue', '20000000');
            });

            await act(() => result.current.trigger('cryptoValue'));

            const { invalid } = result.current.getFieldState('cryptoValue');

            expect(invalid).toBe(false);
        });

        it('should format a token named BTC as a token', async () => {
            const store = getInitializedStore(true);
            const { result } = await renderUseTradingBuyForm(store);
            const btcTokenAsset: TradeableAsset = {
                ...btcAsset,
                cryptoId: 'ethereum--0x123' as CryptoId,
                networkId: 'ethereum',
                contractAddress: '0x123' as TokenAddress,
            };

            await act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcTokenAsset);
            });
            await act(() => {
                store.dispatch(
                    tradingBuyActions.setAmountLimits({
                        minCrypto: '0.1',
                        currency: 'BTC',
                    }),
                );
            });
            await act(() => {
                result.current.setValue('cryptoValue', '0.01');
            });

            await act(() => result.current.trigger('cryptoValue'));

            const { error, invalid } = result.current.getFieldState('cryptoValue');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: 'Minimum is 0.1 BTC' }));
        });

        it('should validate a token named BTC in base units when SATS are enabled', async () => {
            const store = getInitializedStore(true);
            const { result } = await renderUseTradingBuyForm(store);
            const btcTokenAsset: TradeableAsset = {
                ...btcAsset,
                cryptoId: 'ethereum--0x123' as CryptoId,
                networkId: 'ethereum',
                contractAddress: '0x123' as TokenAddress,
            };

            await act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcTokenAsset);
            });
            await act(() => {
                store.dispatch(
                    tradingBuyActions.setAmountLimits({
                        minCrypto: '0.1',
                        maxCrypto: '2',
                        currency: 'BTC',
                    }),
                );
            });
            await act(() => {
                result.current.setValue('cryptoValue', '0.2');
            });

            await act(() => result.current.trigger('cryptoValue'));

            expect(result.current.getFieldState('cryptoValue').invalid).toBe(false);

            await act(() => {
                result.current.setValue('cryptoValue', '3');
            });

            await act(() => result.current.trigger('cryptoValue'));

            const { error, invalid } = result.current.getFieldState('cryptoValue');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: 'Maximum is 2 BTC' }));
        });

        it('should trigger validation once limits are loaded', async () => {
            const store = getInitializedStore(true);
            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
                result.current.setValue('fiatValue', '1');
                result.current.setValue('asset', btcAsset);
            });

            await act(async () => {
                store.dispatch(
                    tradingBuyActions.setAmountLimits({
                        minFiat: '10',
                        currency: 'USD',
                    }),
                );
                // allow to form.trigger validation to finish
                await Promise.resolve();
            });

            const { invalid } = result.current.getFieldState('fiatValue');

            expect(invalid).toBe(true);
        });

        describe('generalAlert', () => {
            it('should be undefined by default', async () => {
                const store = getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                await act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes([] as BuyTrade[]));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be set when empty quotes are fetched and no limits are set', async () => {
                const store = getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                await act(() => {
                    store.dispatch(
                        tradingBuyActions.saveQuoteRequest({
                            receiveCurrency: 'BTC' as CryptoId,
                            fiatAmount: 10,
                            fiatCurrency: 'USD',
                            wantCrypto: true,
                        }),
                    );
                    store.dispatch(tradingBuyActions.saveQuotes([] as BuyTrade[]));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toEqual(
                    'No offers found. Adjust the currency, assets, or amounts.',
                );
            });

            it('should be undefined when empty quotes are fetched and limits are set', async () => {
                const store = getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                await act(() => {
                    store.dispatch(
                        tradingBuyActions.saveQuoteRequest({
                            receiveCurrency: 'BTC' as CryptoId,
                            fiatAmount: 10,
                            fiatCurrency: 'USD',
                            wantCrypto: true,
                        }),
                    );
                    store.dispatch(tradingBuyActions.saveQuotes([] as BuyTrade[]));
                    store.dispatch(
                        tradingBuyActions.setAmountLimits({
                            currency: 'USD',
                            minFiat: '100',
                        }),
                    );
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be undefined when quotes are being fetched ', async () => {
                const store = getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                await act(() => {
                    store.dispatch(
                        tradingBuyActions.saveQuoteRequest({
                            receiveCurrency: 'BTC' as CryptoId,
                            fiatAmount: 10,
                            fiatCurrency: 'USD',
                            wantCrypto: true,
                        }),
                    );
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be cleared once quotes are fetched', async () => {
                const store = getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                await act(() => {
                    store.dispatch(
                        tradingBuyActions.saveQuoteRequest({
                            receiveCurrency: 'BTC' as CryptoId,
                            fiatAmount: 10,
                            fiatCurrency: 'USD',
                            wantCrypto: true,
                        }),
                    );
                    store.dispatch(tradingBuyActions.saveQuotes([] as BuyTrade[]));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                await act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });
        });
    });

    describe('on country change', () => {
        it('should set country to redux on change', async () => {
            const store = getInitializedStore(true);
            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
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

    describe('clearBuyFormQuoteData', () => {
        it('should clear quote, fiatValue, cryptoValue and generalAlert data', async () => {
            const store = getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            await act(() => {
                result.current.setValue('fiatValue', '10');
                result.current.setValue('cryptoValue', '10');
                result.current.setValue('quote', mercuryoApplePayBuyQuote);
            });

            await act(() => {
                clearBuyFormQuoteData(result.current);
            });

            expect(result.current.getValues('quote')).toBeUndefined();
            expect(result.current.getValues('fiatValue')).toBeUndefined();
            expect(result.current.getValues('cryptoValue')).toBeUndefined();
        });
    });
});
