import type { ExchangeTrade } from 'invity-api';

import {
    exchangeThunks,
    selectTradingProviderMetadata,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { FeatureFlag } from '@suite-native/feature-flags';
import { useAnalytics } from '@suite-native/services';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    btcAsset,
    cexdirectFloatingQuote,
    exchangeCexdirect,
    exchangeQuotes,
    getBtcAccount,
    invityDexQuote,
    mercuryoFixedBestQuote,
    mercuryoFixedWorstQuote,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { createTradingLightStore } from '../../../__tests__/tradingTestUtils';
import { clearExchangeFormQuoteData, useExchangeForm } from '../useExchangeForm';

const mockReport = jest.fn();
type PrefetchDexQuoteApprovalThunk = typeof exchangeThunks.prefetchDexQuoteApprovalThunk;

const createPrefetchDexQuoteApprovalThunkMock = (
    arg: Parameters<PrefetchDexQuoteApprovalThunk>[0],
): ReturnType<PrefetchDexQuoteApprovalThunk> => {
    const result = Promise.resolve(undefined) as unknown as ReturnType<
        ReturnType<PrefetchDexQuoteApprovalThunk>
    >;
    result.abort = jest.fn();
    result.requestId = 'mock-request-id';
    result.arg = arg;
    result.unwrap = () => Promise.resolve(undefined);

    return () => result;
};

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useExchangeForm', () => {
    let store: TestStore;

    const renderUseExchangeForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            store,
            providers: ['intl', 'navigation', 'formatter'],
        });

    const getInitializedStore = (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN) =>
        createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    settings: {
                        bitcoinAmountUnit,
                    },
                },
                featureFlags: {
                    [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
                },
            },
        });

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        store = getInitializedStore();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: mockReport,
        });

        jest.spyOn(exchangeThunks, 'prefetchDexQuoteApprovalThunk').mockImplementation(
            createPrefetchDexQuoteApprovalThunkMock,
        );
    });

    describe('on quotes change', () => {
        it('should select first fixed quote if rate is better than first floating quote', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(
                    tradingExchangeActions.saveQuotes([
                        mercuryoFixedWorstQuote,
                        mercuryoFixedBestQuote,
                        { ...cexdirectFloatingQuote, rate: 0.000008 },
                    ]),
                );
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'mercuryo-fixed-worst',
                }),
            );
        });

        it('should select first floating quote if rate is better than first fixed quote', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'cexdirect-floating',
                }),
            );
        });

        it('should select first fixed quote if no floating quote is available', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(
                    tradingExchangeActions.saveQuotes([
                        mercuryoFixedWorstQuote,
                        mercuryoFixedBestQuote,
                    ]),
                );
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'mercuryo-fixed-worst',
                }),
            );
        });

        it('should select floating quote when fixed is not available', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(
                    tradingExchangeActions.saveQuotes([cexdirectFloatingQuote, invityDexQuote]),
                );
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'cexdirect-floating',
                }),
            );
        });

        it('should select dex quote when no other quotes are available', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes([invityDexQuote]));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'invity-dex',
                }),
            );
        });

        it('should set quote to undefined when no quotes are available', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes([]));
            });

            expect(result.current.getValues('quote')).toBeUndefined();
        });

        it('should set receiveCryptoAmount based on selected quote', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('receiveCryptoAmount')).toBe('0.00089118');
        });

        it('should set receiveCryptoAmount in sats when using BTC and amount in sats', () => {
            store = getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = renderUseExchangeForm();
            act(() => {
                result.current.setValue('receiveAsset', btcAsset);
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('receiveCryptoAmount')).toBe('89118');
        });

        it('should persist provider metadata to redux', () => {
            renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(selectTradingProviderMetadata(store.getState())).toBe(exchangeCexdirect);
        });

        describe('when quote is selected and new quotes are fetched', () => {
            let form: ExchangeFormType;

            beforeEach(() => {
                const { result } = renderUseExchangeForm();
                form = result.current;

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes([...exchangeQuotes]));
                });
            });

            it('should select quote with same Rate and Provider', () => {
                act(() => {
                    form.setValue('quote', {
                        ...invityDexQuote,
                        quoteId: 'invity-dex-outdated',
                    });
                });

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes([...exchangeQuotes]));
                });

                expect(form.getValues('quote')).toEqual(
                    expect.objectContaining({
                        quoteId: 'invity-dex',
                    }),
                );
            });

            it('should select quote with same Rate when same provider is not available', () => {
                act(() => {
                    form.setValue('quote', {
                        ...invityDexQuote,
                        quoteId: 'invity-dex-outdated',
                    });
                });

                act(() => {
                    store.dispatch(
                        tradingExchangeActions.saveQuotes(exchangeQuotes.toSpliced(3, 1)),
                    );
                });

                expect(form.getValues('quote')).toEqual(
                    expect.objectContaining({
                        quoteId: 'mercuryo-dex',
                    }),
                );
            });

            it('should select floating quote when floating quote was previously selected', () => {
                act(() => {
                    form.setValue('quote', {
                        ...cexdirectFloatingQuote,
                        quoteId: 'cexdirect-floating-outdated',
                    });
                });

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
                });

                expect(form.getValues('quote')).toEqual(
                    expect.objectContaining({
                        quoteId: 'cexdirect-floating',
                    }),
                );
            });
        });
    });

    describe('dex quote approval prefetch', () => {
        const dexQuoteWithDexTx = {
            ...invityDexQuote,
            dexTx: {
                from: '0x0000000000000000000000000000000000000000',
                to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
                data: '0x095ea7b3000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee570000000000000000000000000000000000000000000000000000000005f5e100',
                value: '0x0',
            },
        } as ExchangeTrade;

        it('should confirm dex quote once selected in form', async () => {
            renderUseExchangeForm();

            await act(async () => {
                store.dispatch(
                    tradingExchangeActions.setTradingAccountKey(
                        'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
                store.dispatch(
                    tradingExchangeActions.setReceiveAccountKey(
                        'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
                store.dispatch(tradingExchangeActions.saveQuotes([dexQuoteWithDexTx]));
                await Promise.resolve();
            });

            expect(exchangeThunks.prefetchDexQuoteApprovalThunk).toHaveBeenCalledTimes(1);
            expect(exchangeThunks.prefetchDexQuoteApprovalThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    trade: expect.objectContaining({ quoteId: dexQuoteWithDexTx.quoteId }),
                }),
            );
        });

        it('should not confirm the same dex quote repeatedly', async () => {
            renderUseExchangeForm();

            await act(async () => {
                store.dispatch(
                    tradingExchangeActions.setTradingAccountKey(
                        'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
                store.dispatch(
                    tradingExchangeActions.setReceiveAccountKey(
                        'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
                store.dispatch(tradingExchangeActions.saveQuotes([dexQuoteWithDexTx]));
                await Promise.resolve();
                store.dispatch(
                    tradingExchangeActions.saveQuotes([{ ...dexQuoteWithDexTx, rate: 0.0000089 }]),
                );
                await Promise.resolve();
            });

            expect(exchangeThunks.prefetchDexQuoteApprovalThunk).toHaveBeenCalledTimes(1);
        });
    });

    describe('sendAccount', () => {
        it('should be undefined by default', () => {
            const { result } = renderUseExchangeForm();

            expect(result.current.getValues('sendAccount')).toBeUndefined();
        });

        it('should update sendAccount value when account in redux store is changed', () => {
            const { result } = renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
            });

            expect(result.current.getValues('sendAccount')).toEqual(getBtcAccount(btc1AccountKey));
        });
    });

    describe('sendAsset', () => {
        it('should clear crypto amount on change', () => {
            const { result } = renderUseExchangeForm();
            act(() => {
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', '100');
            });

            act(() => {
                result.current.setValue('sendAsset', usdcAsset);
            });

            expect(result.current.getValues('sendCryptoAmount')).toBeUndefined();
        });

        it('should report change to analytics', () => {
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
            });

            expect(mockReport).toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'exchange',
                    parameter: 'cryptoFrom',
                },
            });
        });

        it('should dispatch sendAssetChanged action', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
            });

            expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.sendAssetChanged());
        });

        it('should clear receiveAsset when sendAsset has same cryptoId as receiveAsset', () => {
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('receiveAsset', btcAsset);
                result.current.setValue('sendAsset', btcAsset);
            });

            expect(result.current.getValues('receiveAsset')).toBeUndefined();
        });
    });

    describe('receiveAccount', () => {
        it('should be undefined by default', () => {
            const { result } = renderUseExchangeForm();

            expect(result.current.getValues('receiveAccount')).toBeUndefined();
        });

        it('should update receiveAccount value when account in redux store is changed', () => {
            const { result } = renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setReceiveAccountKey(btc1AccountKey));
            });

            expect(result.current.getValues('receiveAccount')).toEqual(
                expect.objectContaining({
                    account: getBtcAccount(btc1AccountKey),
                }),
            );
        });
    });

    describe('receiveAsset', () => {
        it('should report change to analytics', () => {
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('receiveAsset', btcAsset);
            });

            expect(mockReport).toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'exchange',
                    parameter: 'cryptoTo',
                },
            });
        });

        it('should dispatch receiveAssetChanged action', () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('receiveAsset', btcAsset);
            });

            expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        });
    });

    describe('validations', () => {
        it.each([
            ['0.00001', 'Minimum is 0.0001 BTC'],
            ['100', 'Maximum is 50 BTC'],
            ['1', 'Insufficient balance'],
        ])('should display error for crypto amount %s BTC', async (amount, expectedValue) => {
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(
                    tradingExchangeActions.setAmountLimits({
                        minCrypto: '0.0001',
                        maxCrypto: '50',
                        currency: 'BTC',
                    }),
                );
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { error, invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it.each([
            ['100', 'Minimum is 10,000 sat'],
            ['10000000000', 'Maximum is 5,000,000,000 sat'],
            ['10000000', 'Insufficient balance'],
        ])('should display error for crypto amount %s SATS', async (amount, expectedValue) => {
            store = getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(
                    tradingExchangeActions.setAmountLimits({
                        minCrypto: '0.0001',
                        maxCrypto: '50',
                        currency: 'BTC',
                    }),
                );
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { error, invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it('should correctly compute balance with SATS', async () => {
            store = getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', '10000');
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(false);
        });

        it.each<[string, boolean]>([
            ['1', false],
            ['2', true],
        ])('should use correct balance for USDC and amount %s', async (amount, expectedInvalid) => {
            const { result } = renderUseExchangeForm();

            act(() => {
                store.dispatch(
                    tradingExchangeActions.setTradingAccountKey(
                        'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
                result.current.setValue('sendAsset', usdcAsset);
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(expectedInvalid);
        });

        it('should trigger validation once limits are loaded', async () => {
            act(() => {
                store.dispatch(tradingExchangeActions.setAmountLimits(undefined));
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
            });

            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', '10');
            });

            await act(async () => {
                store.dispatch(
                    tradingExchangeActions.setAmountLimits({
                        maxCrypto: '5',
                        currency: 'BTC',
                    }),
                );
                // allow to form.trigger validation to finish
                await Promise.resolve();
            });

            const { invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
        });

        describe('generalAlert', () => {
            it('should be undefined by default', () => {
                const { result } = renderUseExchangeForm();

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes([] as ExchangeTrade[]));
                    store.dispatch(tradingExchangeActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be set when empty quotes are fetched and no limits are set', () => {
                const { result } = renderUseExchangeForm();

                act(() => {
                    store.dispatch(
                        tradingExchangeActions.saveQuoteRequest({
                            send: btcAsset.cryptoId,
                            receive: usdcAsset.cryptoId,
                            sendStringAmount: '1',
                        }),
                    );
                    store.dispatch(tradingExchangeActions.saveQuotes([] as ExchangeTrade[]));
                    store.dispatch(tradingExchangeActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toEqual(
                    'No offers available for your request. Change amount or currency.',
                );
            });

            it('should be undefined when empty quotes are fetched and limits are set', () => {
                const { result } = renderUseExchangeForm();

                act(() => {
                    store.dispatch(
                        tradingExchangeActions.saveQuoteRequest({
                            send: btcAsset.cryptoId,
                            receive: usdcAsset.cryptoId,
                            sendStringAmount: '1',
                        }),
                    );
                    store.dispatch(tradingExchangeActions.saveQuotes([] as ExchangeTrade[]));
                    store.dispatch(
                        tradingExchangeActions.setAmountLimits({
                            currency: 'BTC',
                            minCrypto: '0.0001',
                        }),
                    );
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be undefined once quotes are fetched', () => {
                const { result } = renderUseExchangeForm();

                act(() => {
                    store.dispatch(
                        tradingExchangeActions.saveQuoteRequest({
                            send: btcAsset.cryptoId,
                            receive: usdcAsset.cryptoId,
                            sendStringAmount: '1',
                        }),
                    );
                    store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
                    store.dispatch(tradingExchangeActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be cleared once quotes are fetched', () => {
                const { result } = renderUseExchangeForm();

                act(() => {
                    store.dispatch(
                        tradingExchangeActions.saveQuoteRequest({
                            send: btcAsset.cryptoId,
                            receive: usdcAsset.cryptoId,
                            sendStringAmount: '1',
                        }),
                    );
                    store.dispatch(tradingExchangeActions.saveQuotes([] as ExchangeTrade[]));
                    store.dispatch(tradingExchangeActions.setAmountLimits(undefined));
                });

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });
        });
    });

    describe('clearExchangeFormQuoteData', () => {
        it('should clear quote, sendCryptoAmount, receiveCryptoAmount and generalAlert data', () => {
            const { result } = renderUseExchangeForm();

            act(() => {
                result.current.setValue('quote', mercuryoFixedWorstQuote as ExchangeTrade);
                result.current.setValue('sendCryptoAmount', '10');
                result.current.setValue('receiveCryptoAmount', '10');
                result.current.setValue('generalAlert', 'test');
            });

            act(() => {
                clearExchangeFormQuoteData(result.current);
            });

            expect(result.current.getValues('quote')).toBeUndefined();
            expect(result.current.getValues('sendCryptoAmount')).toBeUndefined();
            expect(result.current.getValues('receiveCryptoAmount')).toBeUndefined();
            expect(result.current.getValues('generalAlert')).toBeUndefined();
        });
    });
});
