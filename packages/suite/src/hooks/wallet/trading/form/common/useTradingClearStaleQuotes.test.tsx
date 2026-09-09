import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingRootState,
    type TradingType,
    tradingBuyActions,
    tradingExchangeActions,
    initialState as tradingInitialState,
    tradingSellActions,
} from '@suite-common/trading';

import { useTradingClearStaleQuotes } from './useTradingClearStaleQuotes';

const clearQuotesActionTypeByType = {
    buy: tradingBuyActions.clearQuotes.type,
    sell: tradingSellActions.clearQuotes.type,
    exchange: tradingExchangeActions.clearQuotes.type,
} satisfies Record<TradingType, string>;

const getState = (type: TradingType, hasQuotes: boolean): TradingRootState => ({
    wallet: {
        trading: {
            ...tradingInitialState,
            buy: {
                ...tradingInitialState.buy,
                quotes: type === 'buy' && hasQuotes ? [{ quoteId: '1' }] : [],
            },
            sell: {
                ...tradingInitialState.sell,
                quotes: type === 'sell' && hasQuotes ? [{ quoteId: '1' }] : [],
            },
            exchange: {
                ...tradingInitialState.exchange,
                quotes: type === 'exchange' && hasQuotes ? [{ quoteId: '1' }] : [],
            },
        },
    },
});

const renderClearStaleQuotes = (
    state: TradingRootState,
    props: { type: TradingType; isAmountEmpty: boolean },
) => {
    const root = createTestCompositionRoot({
        preloadedState: state,
    });

    renderHookWithStoreProvider(() => useTradingClearStaleQuotes(props), { root });

    const { getActions } = root.services;

    return { getActions };
};

const tradingTypes: TradingType[] = ['buy', 'sell', 'exchange'];

describe('useTradingClearStaleQuotes', () => {
    it.each(tradingTypes)(
        'dispatches %s clearQuotes when amount is empty and quotes exist',
        type => {
            const { getActions } = renderClearStaleQuotes(getState(type, true), {
                type,
                isAmountEmpty: true,
            });

            expect(getActions()).toEqual([{ type: clearQuotesActionTypeByType[type] }]);
        },
    );

    it('does not dispatch when amount is not empty', () => {
        const { getActions } = renderClearStaleQuotes(getState('buy', true), {
            type: 'buy',
            isAmountEmpty: false,
        });

        expect(getActions()).toEqual([]);
    });

    it('does not dispatch when there are no quotes to clear', () => {
        const { getActions } = renderClearStaleQuotes(getState('buy', false), {
            type: 'buy',
            isAmountEmpty: true,
        });

        expect(getActions()).toEqual([]);
    });
});
