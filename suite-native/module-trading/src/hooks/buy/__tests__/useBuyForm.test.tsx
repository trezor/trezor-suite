import { Platform } from 'react-native';

import { type EnhancedStore } from '@reduxjs/toolkit';
import type { BuyTrade, CryptoId } from 'invity-api';

import { selectTradingProviderMetadata, tradingBuyActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { Form, useField } from '@suite-native/forms';
import {
    type PreloadedState,
    type TestStore,
    act,
    initStore,
    renderHook,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import {
    btcAsset,
    buyMercuryo,
    buyQuotes,
    getBtcAccount,
    getInitializedTradingState,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { buyActions, selectTradingResidenceCountry } from '@suite-native/trading-state';
import { type BuyFormType, type TradeableAsset } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { clearBuyFormQuoteData, useBuyForm } from '../useBuyForm';

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) => fn(),
    };
});

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc2AccountKey = 'btc-account-2' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc3AccountKey = 'btc-account-3' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useBuyForm', () => {
    const renderUseTradingBuyForm = (store: TestStore) =>
        renderHookWithStoreProvider(() => useBuyForm(), { store });

    const getInitializedStore = (amountInSats = false) => {
        const preloadedState: PreloadedState = {
            wallet: {
                trading: getInitializedTradingState(),
                settings: {
                    bitcoinAmountUnit: amountInSats
                        ? PROTO.AmountUnit.SATOSHI
                        : PROTO.AmountUnit.BITCOIN,
                },
                accounts: [
                    getBtcAccount(btc1AccountKey),
                    getBtcAccount(btc2AccountKey),
                    { ...getBtcAccount(btc3AccountKey), descriptor: '' },
                ],
            },
        };
        preloadedState.wallet!.trading!.buy!.tradingAccountKey = btc1AccountKey;

        return initStore(preloadedState).store;
    };

    const initFormAndQuotes = (form: BuyFormType, store: EnhancedStore) => {
        act(() => {
            form.setValue('fiatValue', '10');
            form.setValue('asset', btcAsset);
        });

        act(() => {
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

    it('should update form value when account in redux store is changed', () => {
        const store = getInitializedStore();
        const { result } = renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(tradingBuyActions.setTradingAccountKey(btc2AccountKey));
        });

        expect(result.current.getValues('receiveAccount')).toEqual({
            account: expect.objectContaining({ key: btc2AccountKey }),
        });
    });

    it('should dispatch tradingBuy/assetChanged on asset change', () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseTradingBuyForm(store);

        dispatchSpy.mockClear();
        act(() => {
            result.current.setValue('asset', usdcAsset);
        });
        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetChanged());
    });

    it('should not clear selected account when asset is set to undefined', () => {
        const store = getInitializedStore();
        const { result } = renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(tradingBuyActions.setTradingAccountKey(btc1AccountKey));
            result.current.setValue('asset', undefined as unknown as TradeableAsset);
        });

        expect(result.current.getValues('receiveAccount')).toEqual({
            account: expect.objectContaining({ key: btc1AccountKey }),
        });
    });

    it('should clear crypto amount on coin change', () => {
        const store = getInitializedStore();
        const { result } = renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('asset', btcAsset);
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('asset', usdcAsset);
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear crypto amount on fiat currency change', () => {
        const store = getInitializedStore();
        const { result } = renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear fiat amount on fiat currency change', () => {
        const store = getInitializedStore();
        const { result } = renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
    });

    it('should dispatch fiatCurrencyChanged action on fiat currency change', () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseTradingBuyForm(store);

        dispatchSpy.mockClear();
        act(() => {
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.fiatCurrencyChanged());
    });

    it('should clear cryptoValue when user edits fiatValue', () => {
        const store = getInitializedStore();
        const { result, unmount } = renderUseTradingBuyForm(store);
        const { result: fieldResult, unmount: unmountField } = renderHook(
            () => useField({ name: 'fiatValue' }),
            {
                wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
            },
        );

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('focusedValue', 'fiatValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toEqual('10');

        unmountField();
        unmount();
    });

    it('should clear fiatValue when user edits cryptoValue', () => {
        const store = getInitializedStore();
        const { result, unmount } = renderUseTradingBuyForm(store);
        const { result: fieldResult, unmount: unmountField } = renderHook(
            () => useField({ name: 'cryptoValue' }),
            {
                wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
            },
        );

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('focusedValue', 'cryptoValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toEqual('10');

        unmountField();
        unmount();
    });

    it('should set amountInCrypto to true when user edits cryptoValue', () => {
        const store = getInitializedStore();
        const { result, unmount } = renderUseTradingBuyForm(store);
        const { result: fieldResult, unmount: unmountField } = renderHook(
            () => useField({ name: 'cryptoValue' }),
            {
                wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
            },
        );

        act(() => {
            result.current.setValue('focusedValue', 'cryptoValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('amountInCrypto')).toBe(true);

        unmountField();
        unmount();
    });

    it('should set amountInCrypto to false when user edits fiatValue', () => {
        const store = getInitializedStore();
        const { result, unmount } = renderUseTradingBuyForm(store);
        const { result: fieldResult, unmount: unmountField } = renderHook(
            () => useField({ name: 'fiatValue' }),
            {
                wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
            },
        );

        act(() => {
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('focusedValue', 'fiatValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('amountInCrypto')).toBe(false);

        unmountField();
        unmount();
    });

    describe('on quotes change', () => {
        it.each<[string, string]>([
            ['ios', 'applePay'],
            ['android', 'googlePay'],
            ['web', 'creditCard'],
        ])(
            'if no quote is selected should select 1st quote with %s payment method based on %s',
            (platform, method) => {
                jest.spyOn(Platform, 'select').mockImplementation(
                    (option: any) => option[platform],
                );

                const store = getInitializedStore();
                const { result } = renderUseTradingBuyForm(store);

                initFormAndQuotes(result.current, store);

                expect(result.current.getValues('quote')).toEqual(
                    expect.objectContaining({
                        paymentMethod: method,
                    }),
                );

                jest.restoreAllMocks();
            },
        );

        it('if no quote is selected and preferred method is not available should select 1st quote with credit card', () => {
            jest.spyOn(Platform, 'select').mockImplementation((option: any) => option['ios']);
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('fiatValue', '10');
                result.current.setValue('asset', btcAsset);
                // Only provide credit card quote
                store.dispatch(tradingBuyActions.saveQuotes([buyQuotes[0]]));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    paymentMethod: 'applePay',
                    exchange: 'mercuryo',
                }),
            );
            jest.restoreAllMocks();
        });

        it('should set quote to undefined when no quotes are available', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            initFormAndQuotes(result.current, store);

            act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('quote')).toBeUndefined();
        });

        it('should clear cryptoValue when no quotes are available', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            initFormAndQuotes(result.current, store);

            act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('cryptoValue')).toBeUndefined();
            expect(result.current.getValues('fiatValue')).toBe('10');
        });

        it('should clear fiatValue when no quotes are available and user inserted cryptoValue', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcAsset);
                result.current.setValue('cryptoValue', '1');
                store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            });

            act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('fiatValue')).toBeUndefined();
            expect(result.current.getValues('cryptoValue')).toBe('1');
        });

        it('should update cryptoValue when selected quote is changed and truncate it to 9 decimals', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            initFormAndQuotes(result.current, store);

            act(() => {
                result.current.setValue('quote', buyQuotes[0]);
            });

            expect(result.current.getValues('cryptoValue')).toEqual('0.001000168');
            expect(result.current.getValues('fiatValue')).toEqual('10');
        });

        it('should update fiatAmount when selected quote is changed and user inserted cryptoAmount and truncate it to 3 decimals', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('asset', btcAsset);
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('cryptoValue', '100');
                store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            });

            act(() => {
                const newQuote = { ...buyQuotes[0], fiatStringAmount: '10.123456789' } as BuyTrade;
                result.current.setValue('quote', newQuote);
            });

            expect(result.current.getValues('cryptoValue')).toEqual('100');
            expect(result.current.getValues('fiatValue')).toEqual('10.123');
        });

        it('should persist provider metadata to redux', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            initFormAndQuotes(result.current, store);

            act(() => {
                result.current.setValue('quote', buyQuotes[0]);
            });

            expect(selectTradingProviderMetadata(store.getState())).toBe(buyMercuryo);
        });

        describe('when quote is selected and new quotes are fetched', () => {
            let store: EnhancedStore;
            let form: BuyFormType;

            beforeEach(() => {
                store = getInitializedStore();
                const { result } = renderUseTradingBuyForm(store);
                form = result.current;

                act(() => {
                    result.current.setValue('asset', btcAsset);
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('cryptoValue', '100');
                });
            });

            it('should select quote with same payment method and provider', () => {
                act(() => {
                    form.setValue('quote', { ...buyQuotes[3], orderId: 'test1' } as BuyTrade);
                });

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                expect(form.getValues('quote')).toEqual(buyQuotes[3]);
            });

            it('should select 1st quote with same payment method if same provider is not available', () => {
                act(() => {
                    form.setValue('quote', {
                        ...buyQuotes[3],
                        orderId: 'test1',
                        exchange: 'unavailable',
                    } as BuyTrade);
                });

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                expect(form.getValues('quote')).toEqual(buyQuotes[1]);
            });

            it('should select 1st quote on new quotes when payment method is not available even with different provider', () => {
                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes([buyQuotes[0]]));
                });

                expect(form.getValues('quote')).toEqual(
                    expect.objectContaining({
                        paymentMethod: 'applePay',
                    }),
                );
            });
        });
    });

    it('should set correct cryptoValue when using BTC and amount in sats', () => {
        const store = getInitializedStore(true);
        const { result } = renderUseTradingBuyForm(store);

        initFormAndQuotes(result.current, store);

        expect(result.current.getValues('cryptoValue')).toEqual('100016.8');
    });

    describe('validations', () => {
        it.each([
            ['10', 'Minimum is $1,000.00'],
            ['3000', 'Maximum is $2,000.00'],
        ])('should display fiat error for amount %s', async (amount, expectedValue) => {
            const store = getInitializedStore(true);

            const { result } = renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('fiatValue', amount);
                result.current.setValue('asset', btcAsset);
            });

            act(() => {
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
                const { result } = renderUseTradingBuyForm(store);

                act(() => {
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('asset', btcAsset);
                });
                act(() => {
                    store.dispatch(
                        tradingBuyActions.setAmountLimits({
                            minCrypto: '0.1',
                            maxCrypto: '2',
                            currency: 'BTC',
                        }),
                    );
                });
                act(() => {
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
            const { result } = renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcAsset);
            });
            act(() => {
                store.dispatch(
                    tradingBuyActions.setAmountLimits({
                        minCrypto: '0.1',
                        maxCrypto: '2',
                        currency: 'BTC',
                    }),
                );
            });
            act(() => {
                result.current.setValue('cryptoValue', '20000000');
            });

            await act(() => result.current.trigger('cryptoValue'));

            const { invalid } = result.current.getFieldState('cryptoValue');

            expect(invalid).toBe(false);
        });

        it('should trigger validation once limits are loaded', async () => {
            const store = getInitializedStore(true);
            const { result } = renderUseTradingBuyForm(store);

            act(() => {
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
            it('should be undefined by default', () => {
                const store = getInitializedStore(true);
                const { result } = renderUseTradingBuyForm(store);

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes([] as BuyTrade[]));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be set when empty quotes are fetched and no limits are set', () => {
                const store = getInitializedStore(true);
                const { result } = renderUseTradingBuyForm(store);

                act(() => {
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
                    'No offers available for your request. Change amount or currency.',
                );
            });

            it('should be undefined when empty quotes are fetched and limits are set', () => {
                const store = getInitializedStore(true);
                const { result } = renderUseTradingBuyForm(store);

                act(() => {
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

            it('should be undefined when quotes are being fetched ', () => {
                const store = getInitializedStore(true);
                const { result } = renderUseTradingBuyForm(store);

                act(() => {
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

            it('should be cleared once quotes are fetched', () => {
                const store = getInitializedStore(true);
                const { result } = renderUseTradingBuyForm(store);

                act(() => {
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

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });
        });
    });

    describe('on country change', () => {
        it('should set country to redux on change', () => {
            const store = getInitializedStore(true);
            const { result } = renderUseTradingBuyForm(store);

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

    describe('clearBuyFormQuoteData', () => {
        it('should clear quote, fiatValue, cryptoValue and generalAlert data', () => {
            const store = getInitializedStore();
            const { result } = renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('fiatValue', '10');
                result.current.setValue('cryptoValue', '10');
                result.current.setValue('quote', buyQuotes[0]);
            });

            act(() => {
                clearBuyFormQuoteData(result.current);
            });

            expect(result.current.getValues('quote')).toBeUndefined();
            expect(result.current.getValues('fiatValue')).toBeUndefined();
            expect(result.current.getValues('cryptoValue')).toBeUndefined();
        });
    });
});
