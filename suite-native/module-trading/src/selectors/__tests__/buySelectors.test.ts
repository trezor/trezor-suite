import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';

import { getBtcAccount } from '../../__fixtures__/account';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingState, tradingSlice } from '../../tradingSlice';
import {
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
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

    describe('selectTradingBuy', () => {
        it('should select trading buy state', () => {
            expect(selectTradingBuy({ wallet: { tradingNew: prevState } })).toEqual(prevState.buy);
        });
    });

    describe('selectBuySelectedReceiveAccount', () => {
        it('should select receiveAccount', () => {
            const receiveAccount = { account: getBtcAccount(), address: undefined };
            prevState.buy.selectedReceiveAccount = receiveAccount;

            expect(selectBuySelectedReceiveAccount({ wallet: { tradingNew: prevState } })).toEqual(
                receiveAccount,
            );
        });
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
                asset: expect.objectContaining({ cryptoId: 'bitcoin' }),
                fiatCurrency: 'czk',
                fiatValue: '2500',
                paymentMethod: {
                    value: 'creditCard',
                    label: 'Credit Card',
                },
                country: {
                    label: '🇨🇿 Czech Republic',
                    value: 'CZ',
                },
                provider: 'invity',
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
});
