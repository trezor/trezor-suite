import { type SellFiatTrade } from 'invity-api';

import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkState, type SuiteRouterHistoryDep, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { type WithServices } from '@suite-common/redux-utils';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingTransactionSell, type TradingType } from '@suite-common/trading';

import { useTradingDetailMissingTradeRedirect } from './useTradingDetailMissingTradeRedirect';

const trade: TradingTransactionSell = {
    tradeType: 'sell',
    date: '2026-09-03T00:00:00.000Z',
    key: 'orderId',
    sendAccountKey: undefined,
    data: { exchange: 'moonpay' } as SellFiatTrade,
};

describe('useTradingDetailMissingTradeRedirect', () => {
    it.each<[TradingType, string]>([
        ['buy', '/accounts/coinmarket/buy'],
        ['sell', '/accounts/coinmarket/sell'],
        ['exchange', '/accounts/coinmarket/exchange'],
    ])('redirects to the %s form when the trade is missing', (tradeType, pathname) => {
        const suiteRouterHistory = { ...mockSuiteRouterHistory(), navigate: jest.fn() };
        const { services } = createTestCompositionRoot<
            WithServices<SuiteRouterHistoryDep>,
            GotoThunkState
        >({
            reducer: { router: routerReducer, locks: locksReducer, modal: modalReducer },
            services: () => ({ suiteRouterHistory }),
        });
        renderHookWithStoreProvider(
            () => useTradingDetailMissingTradeRedirect(tradeType, undefined),
            { services },
        );

        expect(suiteRouterHistory.navigate).toHaveBeenCalledTimes(1);
        expect(suiteRouterHistory.navigate).toHaveBeenCalledWith({ pathname, hash: '' });
    });

    it('stays on the detail when the trade is found', () => {
        const suiteRouterHistory = { ...mockSuiteRouterHistory(), navigate: jest.fn() };
        const { services } = createTestCompositionRoot<
            WithServices<SuiteRouterHistoryDep>,
            GotoThunkState
        >({
            reducer: { router: routerReducer, locks: locksReducer, modal: modalReducer },
            services: () => ({ suiteRouterHistory }),
        });
        renderHookWithStoreProvider(() => useTradingDetailMissingTradeRedirect('sell', trade), {
            services,
        });

        expect(suiteRouterHistory.navigate).not.toHaveBeenCalled();
    });
});
