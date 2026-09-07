import { renderHook } from '@testing-library/react';
import { type SellFiatTrade } from 'invity-api';

import { type TradingTransactionSell, type TradingType } from '@suite-common/trading';

import { useTradingDetailMissingTradeRedirect } from './useTradingDetailMissingTradeRedirect';

const mockDispatch = jest.fn();

jest.mock('@suite-common/redux-utils', () => ({ useDispatch: () => mockDispatch }));

jest.mock('@suite/router', () => ({
    gotoThunk: (payload: unknown) => ({ type: 'goto', payload }),
}));

const trade: TradingTransactionSell = {
    tradeType: 'sell',
    date: '2026-09-03T00:00:00.000Z',
    key: 'orderId',
    sendAccountKey: undefined,
    data: { exchange: 'moonpay' } as SellFiatTrade,
};

describe('useTradingDetailMissingTradeRedirect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each<[TradingType, string]>([
        ['buy', 'wallet-trading-buy'],
        ['sell', 'wallet-trading-sell'],
        ['exchange', 'wallet-trading-exchange'],
    ])('redirects to the %s form when the trade is missing', (tradeType, routeName) => {
        renderHook(() => useTradingDetailMissingTradeRedirect(tradeType, undefined));

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'goto', payload: { routeName } });
    });

    it('stays on the detail when the trade is found', () => {
        renderHook(() => useTradingDetailMissingTradeRedirect('sell', trade));

        expect(mockDispatch).not.toHaveBeenCalled();
    });
});
