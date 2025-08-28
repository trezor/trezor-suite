import { ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { PROTO } from '@trezor/connect';

import { getBtcAccount } from '../../../__fixtures__/account';
import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { btcAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../__fixtures__/walletState';
import { ExchangeFormType } from '../../../types/exchange';
import { clearExchangeFormQuoteData, useExchangeForm } from '../useExchangeForm';

describe('useExchangeForm', () => {
    let store: TestStore;

    const renderUseExchangeForm = () =>
        renderHookWithStoreProviderAsync(() => useExchangeForm(), { store });

    const getInitializedStore = async (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
                bitcoinAmountUnit,
            }),
        };

        return await initStore(preloadedState);
    };

    beforeEach(async () => {
        store = await getInitializedStore();
    });

    describe('on quotes change', () => {
        it('should select fixed quote with best rate', async () => {
            const { result } = await renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'mercuryo-fixed-best',
                }),
            );
        });

        it('should select floating quote when fixed is not available', async () => {
            const { result } = await renderUseExchangeForm();
            act(() => {
                store.dispatch(
                    tradingExchangeActions.saveQuotes([exchangeQuotes[2], exchangeQuotes[3]]),
                );
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'cexdirect-floating',
                }),
            );
        });

        it('should select dex quote when no other quotes are available', async () => {
            const { result } = await renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes([exchangeQuotes[3]]));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'invity-dex',
                }),
            );
        });

        it('should set quote to undefined when no quotes are available', async () => {
            const { result } = await renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes([]));
            });

            expect(result.current.getValues('quote')).toBeUndefined();
        });

        it('should set receiveCryptoAmount based on selected quote', async () => {
            const { result } = await renderUseExchangeForm();
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('receiveCryptoAmount')).toBe('0.00089537');
        });

        it('should sets receiveCryptoAmount in sats when using BTC and amount in sats', async () => {
            store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = await renderUseExchangeForm();
            act(() => {
                result.current.setValue('receiveAsset', btcAsset);
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('receiveCryptoAmount')).toBe('89537');
        });

        describe('when quote is selected and new quotes are fetched', () => {
            let form: ExchangeFormType;

            beforeEach(async () => {
                const { result } = await renderUseExchangeForm();
                form = result.current;

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes([...exchangeQuotes]));
                });
            });

            it('should select quote with same Rate and Provider', () => {
                act(() => {
                    form.setValue('quote', {
                        ...exchangeQuotes[3],
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
                        ...exchangeQuotes[3],
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
                        ...exchangeQuotes[2],
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

    describe('sendAccount', () => {
        it('should be undefined by default', async () => {
            const { result } = await renderUseExchangeForm();

            expect(result.current.getValues('sendAccount')).toBeUndefined();
        });

        it('should update sendAccount value when account in redux store is changed', async () => {
            const { result } = await renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
            });

            expect(result.current.getValues('sendAccount')).toEqual(getBtcAccount('btc-account-1'));
        });
    });

    describe('receiveAccount', () => {
        it('should be undefined by default', async () => {
            const { result } = await renderUseExchangeForm();

            expect(result.current.getValues('receiveAccount')).toBeUndefined();
        });

        it('should update receiveAccount value when account in redux store is changed', async () => {
            const { result } = await renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setReceiveAccountKey('btc-account-1'));
            });

            expect(result.current.getValues('receiveAccount')).toEqual(
                expect.objectContaining({
                    account: getBtcAccount('btc-account-1'),
                }),
            );
        });
    });

    describe('validations', () => {
        it.each([
            ['0.00001', 'Minimum is 0.0001 BTC'],
            ['100', 'Maximum is 50 BTC'],
            ['1', 'Insufficient balance'],
        ])('should display error for crypto amount %s BTC', async (amount, expectedValue) => {
            const { result } = await renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { error, invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it.each([
            ['100', 'Minimum is 10000 sat'],
            ['10000000000', 'Maximum is 5000000000 sat'],
            ['10000000', 'Insufficient balance'],
        ])('should display error for crypto amount %s SATS', async (amount, expectedValue) => {
            store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = await renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { error, invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it('should correctly compute balance with SATS', async () => {
            store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = await renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
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
            const { result } = await renderUseExchangeForm();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('eth-account-1'));
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
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
            });

            const { result } = await renderUseExchangeForm();

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
            it('should be undefined by default', async () => {
                const { result } = await renderUseExchangeForm();

                act(() => {
                    store.dispatch(tradingExchangeActions.saveQuotes([] as ExchangeTrade[]));
                    store.dispatch(tradingExchangeActions.setAmountLimits(undefined));
                });

                expect(result.current.getValues('generalAlert')).toBeUndefined();
            });

            it('should be set when empty quotes are fetched and no limits are set', async () => {
                const { result } = await renderUseExchangeForm();

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

            it('should be undefined when empty quotes are fetched and limits are set', async () => {
                const { result } = await renderUseExchangeForm();

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

            it('should be undefined once quotes are fetched', async () => {
                const { result } = await renderUseExchangeForm();

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

            it('should be cleared once quotes are fetched', async () => {
                const { result } = await renderUseExchangeForm();

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
        it('should clear quote, sendCryptoAmount, receiveCryptoAmount and generalAlert data', async () => {
            const { result } = await renderUseExchangeForm();

            act(() => {
                result.current.setValue('quote', exchangeQuotes[0] as ExchangeTrade);
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
