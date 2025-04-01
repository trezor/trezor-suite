import { act, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import coins from '../../__fixtures__/coins.json';
import { btcAsset } from '../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../types';
import { tradingBuyFormToTradingBuyFormProps } from '../quotesUtils';

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
                form.setValue('paymentMethod', {
                    value: 'creditCard',
                    label: 'Credit Card',
                });
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
                    value: 'creditCard',
                    label: 'Credit Card',
                },
                amountInCrypto: false,
            });
        });
    });
});
