import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingTransactionSell, tradingSellActions } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useSellFlow } from './useSellFlow';

const btcSymbol = asNetworkSymbol('btc');

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        tradingThunks: {
            ...actual.tradingThunks,
            loadInitialDataThunk: (args: unknown) => ({ type: 'trading/loadInitialData', args }),
        },
    };
});

const TRADE: TradingTransactionSell = {
    date: '2024-01-01',
    tradeType: 'sell',
    data: { paymentMethod: 'bankTransfer', exchange: 'provider-1' },
    sendAccountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

type Props = {
    isFromRedirect?: boolean;
    trade?: TradingTransactionSell;
    transactionId?: string;
    isAmountEmpty?: boolean;
};

const renderSellFlow = ({
    isFromRedirect = false,
    trade = undefined,
    transactionId = undefined,
    isAmountEmpty = false,
}: Props = {}) => {
    const store = configureMockStore({
        preloadedState: {
            wallet: { trading: { sell: { quotes: [] } } },
        },
    });

    renderHookWithStoreProvider(
        () => useSellFlow({ isFromRedirect, trade, transactionId, isAmountEmpty }),
        { store },
    );

    return store;
};

const actionTypes = (store: ReturnType<typeof renderSellFlow>) =>
    store.getActions().map(action => action.type);

describe('useSellFlow', () => {
    it('dispatches the initial data load once on mount', () => {
        const store = renderSellFlow();

        expect(
            store.getActions().filter(action => action.type === 'trading/loadInitialData'),
        ).toHaveLength(1);
    });

    it('restores the selected quote, form step and send account on redirect', () => {
        const store = renderSellFlow({
            isFromRedirect: true,
            trade: TRADE,
            transactionId: 'tx-1',
        });

        const types = actionTypes(store);

        expect(types).toContain(tradingSellActions.saveSelectedQuote.type);
        expect(types).toContain(tradingSellActions.setFormStep.type);
        expect(types).toContain(tradingSellActions.setTradingAccountKey.type);
        expect(types).toContain(tradingSellActions.setIsFromRedirect.type);
    });

    it('clears the redirect flag without restoring a trade when the transaction id is missing', () => {
        const store = renderSellFlow({ isFromRedirect: true, trade: TRADE });

        const types = actionTypes(store);

        expect(types).not.toContain(tradingSellActions.saveSelectedQuote.type);
        expect(types).not.toContain(tradingSellActions.setFormStep.type);
        expect(types).toContain(tradingSellActions.setIsFromRedirect.type);
    });

    it('does not restore anything when the redirect flag is not set', () => {
        const store = renderSellFlow({ trade: TRADE, transactionId: 'tx-1' });

        const types = actionTypes(store);

        expect(types).not.toContain(tradingSellActions.saveSelectedQuote.type);
        expect(types).not.toContain(tradingSellActions.setIsFromRedirect.type);
    });
});
