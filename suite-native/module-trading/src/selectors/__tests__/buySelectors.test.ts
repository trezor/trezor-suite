import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';

import { getBtcAccount } from '../../__fixtures__/account';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingState, tradingSlice } from '../../tradingSlice';
import {
    selectBuyAmountLimits,
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
    selectBuySupportedFiatCurrencies,
    selectBuySupportedFiatCurrenciesList,
    selectBuyTradeableAssetsSorted,
    selectTradingBuy,
} from '../buySelectors';

describe('buySelectors', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;
    let prevState: TradingState;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
        prevState = getInitializedTradingState();
    });

    it('selectTradingBuy should select trading buy state', () => {
        expect(selectTradingBuy({ wallet: { tradingNew: prevState } })).toEqual(prevState.buy);
    });

    it('selectBuySelectedReceiveAccount should select receiveAccount', () => {
        const receiveAccount = { account: getBtcAccount(), address: undefined };
        prevState.buy.selectedReceiveAccount = receiveAccount;

        expect(selectBuySelectedReceiveAccount({ wallet: { tradingNew: prevState } })).toEqual(
            receiveAccount,
        );
    });

    describe('selectBuyTradeableAssetsSorted', () => {
        it('should select only coins with buy set to true', () => {
            expect(selectBuyTradeableAssetsSorted({ wallet: { tradingNew: prevState } })).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should sort coins', () => {
            prevState.buy.buyInfo!.supportedCryptoCurrencies = [
                'bitcoin',
                'ethereum',
                'eos',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ] as CryptoId[];

            expect(selectBuyTradeableAssetsSorted({ wallet: { tradingNew: prevState } })).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should be stable', () => {
            const first = selectBuyTradeableAssetsSorted({ wallet: { tradingNew: prevState } });
            const second = selectBuyTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            prevState = tradingReducer(undefined, { type: 'undefined_action' });

            expect(selectBuyTradeableAssetsSorted({ wallet: { tradingNew: prevState } })).toEqual(
                [],
            );
        });
    });

    describe('selectBuyFormDefaultValues', () => {
        it('should return object with empty values when buy info is not initialized ', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(selectBuyFormDefaultValues({ wallet: { tradingNew: state } })).toEqual({});
        });

        it('should return object with computed default values', () => {
            expect(selectBuyFormDefaultValues({ wallet: { tradingNew: prevState } })).toEqual({
                fiatCurrency: 'czk',
                country: {
                    label: '🇨🇿 Czech Republic',
                    value: 'CZ',
                },
                amountInCrypto: false,
            });
        });

        it('should use default value for fiat currency if no fiat is suggested', () => {
            prevState.buy.buyInfo!.buyInfo.suggestedFiatCurrency = undefined;

            expect(selectBuyFormDefaultValues({ wallet: { tradingNew: prevState } })).toEqual(
                expect.objectContaining({
                    fiatCurrency: 'usd',
                }),
            );
        });

        it('should not specify country if country is not in the list', () => {
            prevState.buy.buyInfo!.buyInfo.country = 'XX';

            expect(selectBuyFormDefaultValues({ wallet: { tradingNew: prevState } })).toEqual(
                expect.objectContaining({
                    country: undefined,
                }),
            );
        });
    });

    describe('selectBuySupportedFiatCurrencies', () => {
        it('should select supportedFiatCurrencies', () => {
            expect(selectBuySupportedFiatCurrencies({ wallet: { tradingNew: prevState } })).toEqual(
                ['usd', 'eur', 'czk'],
            );
        });

        it('should return stable empty array when supportedFiatCurrencies are not set', () => {
            prevState.buy.buyInfo = undefined;

            const result = selectBuySupportedFiatCurrencies({ wallet: { tradingNew: prevState } });
            expect(result).toEqual([]);
            expect(selectBuySupportedFiatCurrencies({ wallet: { tradingNew: prevState } })).toEqual(
                result,
            );
        });
    });

    describe('selectBuySupportedFiatCurrenciesList', () => {
        it('should return supportedFiatCurrencies', () => {
            expect(
                selectBuySupportedFiatCurrenciesList({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                {
                    displayValue: 'USD',
                    label: 'United States Dollar',
                    value: 'usd',
                },
                {
                    displayValue: 'EUR',
                    label: 'Euro',
                    value: 'eur',
                },
                {
                    displayValue: 'CZK',
                    label: 'Czech Koruna',
                    value: 'czk',
                },
            ]);
        });

        it('should be stable', () => {
            expect(
                selectBuySupportedFiatCurrenciesList({ wallet: { tradingNew: prevState } }),
            ).toBe(selectBuySupportedFiatCurrenciesList({ wallet: { tradingNew: prevState } }));
        });

        it('should deduplicate values', () => {
            prevState.buy.buyInfo!.supportedFiatCurrencies = ['usd', 'usd', 'eur', 'czk', 'eur'];

            expect(
                selectBuySupportedFiatCurrenciesList({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                expect.objectContaining({ value: 'usd' }),
                expect.objectContaining({ value: 'eur' }),
                expect.objectContaining({ value: 'czk' }),
            ]);
        });

        it('should support values not presented in fiatCurrencies', () => {
            prevState.buy.buyInfo!.supportedFiatCurrencies = ['xxx'];

            expect(
                selectBuySupportedFiatCurrenciesList({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                {
                    displayValue: 'XXX',
                    label: 'XXX',
                    value: 'xxx',
                },
            ]);
        });
    });

    describe('selectBuyAmountLimits', () => {
        it('should return amount limits', () => {
            expect(selectBuyAmountLimits({ wallet: { tradingNew: prevState } })).toEqual({
                currency: 'BTC',
                maxCrypto: '50',
                minCrypto: '0.0001',
            });
        });
    });
});
