import { renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingType,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { configureStore } from 'src/support/tests/configureStore';

import { useTradingClearStaleQuotes } from './useTradingClearStaleQuotes';

const clearQuotesActionTypeByType = {
    buy: tradingBuyActions.clearQuotes.type,
    sell: tradingSellActions.clearQuotes.type,
    exchange: tradingExchangeActions.clearQuotes.type,
} satisfies Record<TradingType, string>;

const getState = (type: TradingType, hasQuotes: boolean) => ({
    wallet: {
        trading: {
            buy: { quotes: type === 'buy' && hasQuotes ? [{ id: '1' }] : [] },
            sell: { quotes: type === 'sell' && hasQuotes ? [{ id: '1' }] : [] },
            exchange: { quotes: type === 'exchange' && hasQuotes ? [{ id: '1' }] : [] },
        },
    },
});

const renderClearStaleQuotes = (
    state: ReturnType<typeof getState>,
    props: { type: TradingType; isAmountEmpty: boolean },
) => {
    const store = configureStore()(state);

    renderHookWithStoreProvider(() => useTradingClearStaleQuotes(props), { store });

    return store;
};

const tradingTypes: TradingType[] = ['buy', 'sell', 'exchange'];

describe('useTradingClearStaleQuotes', () => {
    it.each(tradingTypes)(
        'dispatches %s clearQuotes when amount is empty and quotes exist',
        type => {
            const store = renderClearStaleQuotes(getState(type, true), {
                type,
                isAmountEmpty: true,
            });

            expect(store.getActions()).toEqual([{ type: clearQuotesActionTypeByType[type] }]);
        },
    );

    it('does not dispatch when amount is not empty', () => {
        const store = renderClearStaleQuotes(getState('buy', true), {
            type: 'buy',
            isAmountEmpty: false,
        });

        expect(store.getActions()).toEqual([]);
    });

    it('does not dispatch when there are no quotes to clear', () => {
        const store = renderClearStaleQuotes(getState('buy', false), {
            type: 'buy',
            isAmountEmpty: true,
        });

        expect(store.getActions()).toEqual([]);
    });
});
