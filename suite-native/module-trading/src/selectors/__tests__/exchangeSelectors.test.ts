import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';

import { getBtcAccount } from '../../__fixtures__/account';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingState, tradingSlice } from '../../tradingSlice';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeTradeableAssetsSorted,
    selectTradingExchange,
} from '../exchangeSelectors';

describe('exchangeSelectors', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;
    let prevState: TradingState;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
        prevState = getInitializedTradingState('exchange');
    });

    it('selectTradingExchange should select trading exchange state', () => {
        expect(selectTradingExchange({ wallet: { tradingNew: prevState } })).toEqual(
            prevState.exchange,
        );
    });

    it('selectExchangeSelectedReceiveAccount should select receiveAccount', () => {
        const receiveAccount = { account: getBtcAccount(), address: undefined };
        prevState.exchange.selectedReceiveAccount = receiveAccount;

        expect(selectExchangeSelectedReceiveAccount({ wallet: { tradingNew: prevState } })).toEqual(
            receiveAccount,
        );
    });

    describe('selectExchangeTradeableAssetsSorted', () => {
        it('should select only coins with exchange set to true', () => {
            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should sort coins', () => {
            prevState.exchange.exchangeInfo!.buyCryptoIds = [
                'bitcoin',
                'ethereum',
                'eos',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ] as CryptoId[];

            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([
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
            const first = selectExchangeTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });
            const second = selectExchangeTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            prevState = tradingReducer(undefined, { type: 'undefined_action' });

            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([]);
        });
    });
});
