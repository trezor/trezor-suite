import { Platform } from 'react-native';

import { EnhancedStore } from '@reduxjs/toolkit';
import type { BuyTrade, CryptoId } from 'invity-api';

import { invityAPI, tradingBuyActions } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { Form, useField } from '@suite-native/forms';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHook,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { Address } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

import quotes from '../../../__fixtures__/quotes.json';
import { btcAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { tradingActions } from '../../../tradingSlice';
import { BuyFormType } from '../../../types/buy';
import { TradeableAsset } from '../../../types/general';
import { clearBuyFormQuoteData, useBuyForm } from '../useBuyForm';

jest.mock('../../../utils/general/utils', () => ({
    ...jest.requireActual('../../../utils/general/utils'),
    getRandomAccountDescriptor: () => 'random_string',
}));

describe('useBuyForm', () => {
    const renderUseTradingBuyForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useBuyForm(), { store });

    const getInitializedStore = async (amountInSats = false) => {
        const preloadedState: PreloadedState = {
            wallet: {
                tradingNew: getInitializedTradingState(),
                settings: {
                    bitcoinAmountUnit: amountInSats
                        ? PROTO.AmountUnit.SATOSHI
                        : PROTO.AmountUnit.BITCOIN,
                },
            },
        };
        preloadedState.wallet!.tradingNew!.buy!.selectedReceiveAccount = {
            account: { key: 'btc1' } as Account,
        };

        return await initStore(preloadedState);
    };

    const initFormAndQuotes = (form: BuyFormType, store: EnhancedStore) => {
        act(() => {
            form.setValue('fiatValue', '10');
            form.setValue('asset', btcAsset);
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });
    };

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should update form value when account in redux store is changed', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });

    describe('createInvityAPIKey', () => {
        it('should set random value to invityAPIKey on mount', async () => {
            const invityAPISpy = jest.spyOn(invityAPI, 'createInvityAPIKey');
            const store = await getInitializedStore();

            await renderUseTradingBuyForm(store);

            expect(invityAPISpy).toHaveBeenCalledWith('random_string');
        });

        it('should update invityAPIKey when account is changed', async () => {
            const invityAPISpy = jest.spyOn(invityAPI, 'createInvityAPIKey');
            const store = await getInitializedStore();
            await renderUseTradingBuyForm(store);
            invityAPISpy.mockClear();

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: {
                            account: { key: 'btc2', descriptor: 'descriptor_btc2' } as Account,
                        },
                    }),
                );
            });

            expect(invityAPISpy).toHaveBeenCalledWith('descriptor_btc2');
        });

        it('should not call createInvityAPIKey when descriptor is not changed', async () => {
            const invityAPISpy = jest.spyOn(invityAPI, 'createInvityAPIKey');
            const store = await getInitializedStore();
            await renderUseTradingBuyForm(store);
            invityAPISpy.mockClear();

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: {
                            account: { key: 'btc1', descriptor: 'descriptor_btc1' } as Account,
                        },
                    }),
                );
            });

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: {
                            account: { key: 'btc1', descriptor: 'descriptor_btc1' } as Account,
                            address: { address: 'TEST_BTC_ADDRESS' } as Address,
                        },
                    }),
                );
            });

            expect(invityAPISpy).toHaveBeenCalledTimes(1);
        });

        it('should call createInvityAPIKey with random string when descriptor is empty string', async () => {
            const invityAPISpy = jest.spyOn(invityAPI, 'createInvityAPIKey');
            const store = await getInitializedStore();
            await renderUseTradingBuyForm(store);
            invityAPISpy.mockClear();

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: {
                            account: { key: 'btc1', descriptor: '' } as Account,
                        },
                    }),
                );
            });

            expect(invityAPISpy).toHaveBeenCalledTimes(1);
            expect(invityAPISpy).toHaveBeenCalledWith('random_string');
        });

        it('should call createInvityAPIKey with random string when descriptor is undefined ', async () => {
            const invityAPISpy = jest.spyOn(invityAPI, 'createInvityAPIKey');
            const store = await getInitializedStore();
            await renderUseTradingBuyForm(store);
            invityAPISpy.mockClear();

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: {
                            account: { key: 'btc1', descriptor: 'descriptor_btc1' } as Account,
                        },
                    }),
                );
            });

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: {
                            account: { key: 'btc1' } as Account,
                        },
                    }),
                );
            });

            act(() => {
                store.dispatch(
                    tradingActions.setBuySelectedReceiveAccount({
                        selectedReceiveAccount: undefined,
                    }),
                );
            });

            expect(invityAPISpy).toHaveBeenCalledTimes(2);
            expect(invityAPISpy).toHaveBeenLastCalledWith('random_string');
        });
    });

    it('should dispatch buyAssetChanged on asset change', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('asset', usdcAsset);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalledWith(tradingActions.buyAssetChanged());
    });

    it('should not clear selected account when asset is set to undefined', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
            result.current.setValue('asset', undefined as unknown as TradeableAsset);
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });

    it('should clear crypto amount on coin change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('asset', btcAsset);
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('asset', usdcAsset);
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear crypto amount on fiat currency change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear fiat amount on fiat currency change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
    });

    it('should dispatch buyFiatCurrencyChanged action on fiat currency change', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalledWith(tradingActions.buyFiatCurrencyChanged());
    });

    it('should clear cryptoValue when user edits fiatValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);
        const { result: fieldResult } = renderHook(() => useField({ name: 'fiatValue' }), {
            wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
        });

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('focusedValue', 'fiatValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toEqual('10');
    });

    it('should clear fiatValue when user edits cryptoValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);
        const { result: fieldResult } = renderHook(() => useField({ name: 'cryptoValue' }), {
            wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
        });

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('focusedValue', 'cryptoValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toEqual('10');
    });

    it('should set amountInCrypto to true when user edits cryptoValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);
        const { result: fieldResult } = renderHook(() => useField({ name: 'cryptoValue' }), {
            wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
        });

        act(() => {
            result.current.setValue('focusedValue', 'cryptoValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('amountInCrypto')).toBe(true);
    });

    it('should set amountInCrypto to false when user edits fiatValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);
        const { result: fieldResult } = renderHook(() => useField({ name: 'fiatValue' }), {
            wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
        });

        act(() => {
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('focusedValue', 'fiatValue');
            fieldResult.current.onChange('10');
        });

        expect(result.current.getValues('amountInCrypto')).toBe(false);
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

                const store = await getInitializedStore();
                const { result } = await renderUseTradingBuyForm(store);

                initFormAndQuotes(result.current, store);

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
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('fiatValue', '10');
                result.current.setValue('asset', btcAsset);
                // Only provide credit card quote
                store.dispatch(tradingBuyActions.saveQuotes([quotes[0]] as BuyTrade[]));
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
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            initFormAndQuotes(result.current, store);

            act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('quote')).toBeUndefined();
        });

        it('should clear cryptoValue when no quotes are available', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            initFormAndQuotes(result.current, store);

            act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('cryptoValue')).toBeUndefined();
            expect(result.current.getValues('fiatValue')).toBe('10');
        });

        it('should clear fiatValue when no quotes are available and user inserted cryptoValue', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            // this will load quotes and selects one
            act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('asset', btcAsset);
                result.current.setValue('cryptoValue', '1');
                store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
            });

            act(() => {
                store.dispatch(tradingBuyActions.saveQuotes([]));
            });

            expect(result.current.getValues('fiatValue')).toBeUndefined();
            expect(result.current.getValues('cryptoValue')).toBe('1');
        });

        it('should update cryptoValue when selected quote is changed and truncate it to 9 decimals', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            initFormAndQuotes(result.current, store);

            act(() => {
                result.current.setValue('quote', quotes[0] as BuyTrade);
            });

            expect(result.current.getValues('cryptoValue')).toEqual('0.001000168');
            expect(result.current.getValues('fiatValue')).toEqual('10');
        });

        it('should update fiatAmount when selected quote is changed and user inserted cryptoAmount and truncate it to 3 decimals', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('asset', btcAsset);
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('cryptoValue', '100');
                store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
            });

            act(() => {
                const newQuote = { ...quotes[0], fiatStringAmount: '10.123456789' } as BuyTrade;
                result.current.setValue('quote', newQuote);
            });

            expect(result.current.getValues('cryptoValue')).toEqual('100');
            expect(result.current.getValues('fiatValue')).toEqual('10.123');
        });

        describe('when quote is selected and new quotes are fetched', () => {
            let store: EnhancedStore;
            let form: BuyFormType;

            beforeEach(async () => {
                store = await getInitializedStore();
                const { result } = await renderUseTradingBuyForm(store);
                form = result.current;

                act(() => {
                    result.current.setValue('asset', btcAsset);
                    result.current.setValue('amountInCrypto', true);
                    result.current.setValue('cryptoValue', '100');
                });
            });

            it('should select quote with same payment method and provider', () => {
                act(() => {
                    form.setValue('quote', { ...quotes[3], orderId: 'test1' } as BuyTrade);
                });

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
                });

                expect(form.getValues('quote')).toEqual(quotes[3]);
            });

            it('should select 1st quote with same payment method if same provider is not available', () => {
                act(() => {
                    form.setValue('quote', {
                        ...quotes[3],
                        orderId: 'test1',
                        exchange: 'unavailable',
                    } as BuyTrade);
                });

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
                });

                expect(form.getValues('quote')).toEqual(quotes[1]);
            });

            it('should select 1st quote on new quotes when payment method is not available even with different payment method', () => {
                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
                });

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes([quotes[0]] as BuyTrade[]));
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
        const store = await getInitializedStore(true);
        const { result } = await renderUseTradingBuyForm(store);

        initFormAndQuotes(result.current, store);

        expect(result.current.getValues('cryptoValue')).toEqual('100016.8');
    });

    describe('validations', () => {
        it.each([
            ['10', 'Minimum is $1,000.00'],
            ['3000', 'Maximum is $2,000.00'],
        ])('should display fiat error for amount %s', async (amount, expectedValue) => {
            const store = await getInitializedStore(true);

            const { result } = await renderUseTradingBuyForm(store);

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
            ['10', true, 'Minimum is 10000000 sat'],
            ['300000000', true, 'Maximum is 200000000 sat'],
        ])(
            'should display crypto error for amount %s',
            async (amount, amountInSats, expectedValue) => {
                const store = await getInitializedStore(amountInSats);
                const { result } = await renderUseTradingBuyForm(store);

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

        it('should trigger validation once limits are loaded', async () => {
            const store = await getInitializedStore(true);
            const { result } = await renderUseTradingBuyForm(store);

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
            it('should be undefined by default', async () => {
                const store = await getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                act(() => {
                    store.dispatch(tradingBuyActions.saveQuotes([] as BuyTrade[]));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be set when empty quotes are fetched and no limits are set', async () => {
                const store = await getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

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

            it('should be undefined when empty quotes are fetched and limits are set', async () => {
                const store = await getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

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

            it('should be undefined when quotes are fetched ', async () => {
                const store = await getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

                act(() => {
                    store.dispatch(
                        tradingBuyActions.saveQuoteRequest({
                            receiveCurrency: 'BTC' as CryptoId,
                            fiatAmount: 10,
                            fiatCurrency: 'USD',
                            wantCrypto: true,
                        }),
                    );
                    store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
                    store.dispatch(tradingBuyActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be cleared once quotes are fetched', async () => {
                const store = await getInitializedStore(true);
                const { result } = await renderUseTradingBuyForm(store);

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
                    store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });
        });
    });

    describe('clearBuyFormQuoteData', () => {
        it('should clear quote, fiatValue, cryptoValue and generalAlert data', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseTradingBuyForm(store);

            act(() => {
                result.current.setValue('fiatValue', '10');
                result.current.setValue('cryptoValue', '10');
                result.current.setValue('quote', quotes[0] as BuyTrade);
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
