import { BuyTrade } from 'invity-api';

import { act, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import coins from '../../__fixtures__/coins.json';
import quotes from '../../__fixtures__/quotes.json';
import { btcAsset } from '../../__fixtures__/tradeableAssets';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../__fixtures__/trades';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../types';
import {
    getPaymentMethodFromBuyForm,
    getTradeOperationData,
    tradingBuyFormToTradingBuyFormProps,
} from '../quotesUtils';

describe('quotesUtils', () => {
    let form: TradingBuyForm;

    const renderUseTradingBuyForm = () =>
        renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            preloadedState: { wallet: { tradingNew: getInitializedTradingState() } },
        });

    beforeEach(async () => {
        const { result } = await renderUseTradingBuyForm();
        form = result.current;
    });

    describe('getPaymentMethodFromBuyForm', () => {
        it('should return undefined when quote is not set', () => {
            expect(getPaymentMethodFromBuyForm(form)).toBeUndefined();
        });

        it('should return TradingPaymentMethodListProps object when quote is set', () => {
            act(() => {
                form.setValue('quote', quotes[0] as BuyTrade);
            });

            expect(getPaymentMethodFromBuyForm(form)).toEqual({
                value: 'applePay',
                label: 'Apple Pay',
            });
        });
    });

    describe('tradingBuyFormToTradingBuyFormProps', () => {
        it('should throw when crypto value is not selected', () => {
            expect(() => tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin)).toThrow(
                'Asset is required',
            );
        });

        describe('with buy form populated', () => {
            beforeEach(() => {
                act(() => {
                    form.setValue('fiatValue', '100');
                    form.setValue('asset', btcAsset);
                    form.setValue('country', {
                        value: 'US',
                        label: 'United States of America',
                    });
                    form.setValue('quote', quotes[0] as BuyTrade);
                });
            });

            it('should throw when info is not defined', () => {
                expect(() => tradingBuyFormToTradingBuyFormProps(form, undefined)).toThrow(
                    'CoinInfo is required',
                );
            });

            it('should return correct props', () => {
                const props = tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin);
                expect(props).toEqual({
                    fiatInput: '100',
                    cryptoInput: undefined,
                    currencySelect: {
                        value: 'czk',
                        label: 'Czech Koruna',
                    },
                    cryptoSelect: {
                        coingeckoId: 'bitcoin',
                        contractAddress: null,
                        cryptoName: 'Bitcoin',
                        label: 'BTC',
                        symbol: 'btc',
                        type: 'currency',
                        value: 'bitcoin',
                    },
                    countrySelect: {
                        value: 'US',
                        label: 'United States of America',
                    },
                    paymentMethod: {
                        value: 'applePay',
                        label: 'Apple Pay',
                    },
                    amountInCrypto: false,
                });
            });
        });
    });

    describe('getTradeOperationStrings', () => {
        it('should return correct strings for buy trade', () => {
            const buyTrade = getBuyTrade({});
            const result = getTradeOperationData(buyTrade);

            expect(result).toEqual({
                fromValue: '1234',
                fromCryptoId: 'USD',
                toValue: '0.462586',
                toCryptoId: 'ethereum',
            });
        });

        it('should return correct strings for exchange trade', () => {
            const exchangeTrade = getExchangeTrade({});
            const result = getTradeOperationData(exchangeTrade);

            expect(result).toEqual({
                fromValue: '10.1232',
                fromCryptoId: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
                toValue: '0.462586',
                toCryptoId: 'solana',
            });
        });

        it('should return correct strings for sell trade', () => {
            const sellTrade = getSellTrade({});
            const result = getTradeOperationData(sellTrade);

            expect(result).toEqual({
                fromValue: '1.22',
                fromCryptoId: 'bitcoin',
                toValue: '100',
                toCryptoId: 'USD',
            });
        });
    });
});
