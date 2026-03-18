import type { BuyTrade, CryptoId } from 'invity-api';

import { type TradingAssetOption } from '@suite-common/trading';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils';
import {
    btcAsset,
    buyQuotes,
    coins,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { getPaymentMethodFromBuyForm, tradingBuyFormToTradingBuyFormProps } from '../quotesUtils';

describe('quotesUtils', () => {
    let form: BuyFormType;

    const renderUseTradingBuyForm = () =>
        renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState: { wallet: { trading: getInitializedTradingState() } },
        });

    beforeEach(() => {
        const { result } = renderUseTradingBuyForm();
        form = result.current;
    });

    describe('getPaymentMethodFromBuyForm', () => {
        it('should return undefined when quote is not set', () => {
            expect(getPaymentMethodFromBuyForm(form)).toBeUndefined();
        });

        it('should return TradingPaymentMethodListProps object when quote is set', () => {
            act(() => {
                form.setValue('quote', buyQuotes[0]);
            });

            expect(getPaymentMethodFromBuyForm(form)).toEqual({
                value: 'applePay',
                label: 'Apple Pay',
            });
        });
    });

    describe('tradingBuyFormToTradingBuyFormProps', () => {
        it('should throw when crypto value is not selected', () => {
            expect(() =>
                tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined),
            ).toThrow('Asset is required');
        });

        describe('with buy form populated', () => {
            beforeEach(() => {
                act(() => {
                    form.setValue('fiatValue', '100');
                    form.setValue('asset', btcAsset);
                    form.setValue('country', {
                        codeAlpha3: 'USA',
                        flag: '🇺🇸',
                        name: 'United States of America',
                        value: 'US',
                        label: '🇺🇸 United States',
                        shortLabel: '🇺🇸 USA',
                    });
                    form.setValue('quote', buyQuotes[0]);
                });
            });

            it('should throw when info is not defined', () => {
                expect(() =>
                    tradingBuyFormToTradingBuyFormProps(form, undefined, undefined),
                ).toThrow('CoinInfo is required');
            });

            it('should return correct props', () => {
                const props = tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined);
                expect(props).toEqual({
                    fiatInput: '100',
                    cryptoInput: '0.001000168',
                    currencySelect: {
                        value: 'czk',
                        label: 'Czech Koruna',
                    },
                    cryptoSelect: {
                        id: 'bitcoin' as CryptoId,
                        isNativeToken: true,
                        coingeckoId: 'bitcoin',
                        contractAddress: null,
                        name: 'Bitcoin',
                        symbol: 'btc',
                        displaySymbol: 'BTC',
                        networkName: 'Bitcoin',
                        networkSymbol: 'btc',
                    } satisfies TradingAssetOption,
                    countrySelect: {
                        label: '🇺🇸 United States',
                        codeAlpha3: 'USA',
                        flag: '🇺🇸',
                        name: 'United States of America',
                        shortLabel: '🇺🇸 USA',
                        value: 'US',
                    },
                    paymentMethod: {
                        value: 'applePay',
                        label: 'Apple Pay',
                    },
                    amountInCrypto: false,
                });
            });

            it('should set paymentMethod to undefined when provided quote is not complete', () => {
                act(() => {
                    form.setValue('quote', {
                        ...buyQuotes[0],
                        paymentMethodName: undefined,
                    } as unknown as BuyTrade);
                });

                const props = tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined);

                expect(props).toEqual(
                    expect.objectContaining({
                        paymentMethod: undefined,
                    }),
                );
            });
        });
    });
});
