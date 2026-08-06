import { type CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingTransactionExchange, tradingExchangeActions } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useExchangeFlow } from './useExchangeFlow';

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

const TRADE: TradingTransactionExchange = {
    date: '2024-01-01',
    tradeType: 'exchange',
    data: { exchange: 'provider-1', send: 'bitcoin' as CryptoId, receive: 'ethereum' as CryptoId },
    sendAccountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

type Props = {
    isFromRedirect?: boolean;
    trade?: TradingTransactionExchange;
    transactionId?: string;
    isAmountEmpty?: boolean;
};

const renderExchangeFlow = ({
    isFromRedirect = false,
    trade = undefined,
    transactionId = undefined,
    isAmountEmpty = false,
}: Props = {}) => {
    const store = configureMockStore({
        preloadedState: {
            wallet: { trading: { exchange: { quotes: [] } } },
        },
    });

    renderHookWithStoreProvider(
        () => useExchangeFlow({ isFromRedirect, trade, transactionId, isAmountEmpty }),
        { store },
    );

    return store;
};

const actionTypes = (store: ReturnType<typeof renderExchangeFlow>) =>
    store.getActions().map(action => action.type);

describe('useExchangeFlow', () => {
    it('dispatches the initial data load once on mount', () => {
        const store = renderExchangeFlow();

        expect(
            store.getActions().filter(action => action.type === 'trading/loadInitialData'),
        ).toHaveLength(1);
    });

    it('restores the selected quote, form step and send account on redirect', () => {
        const store = renderExchangeFlow({
            isFromRedirect: true,
            trade: TRADE,
            transactionId: 'tx-1',
        });

        const types = actionTypes(store);

        expect(types).toContain(tradingExchangeActions.saveSelectedQuote.type);
        expect(types).toContain(tradingExchangeActions.setFormStep.type);
        expect(types).toContain(tradingExchangeActions.setTradingAccountKey.type);
        expect(types).toContain(tradingExchangeActions.setIsFromRedirect.type);
    });

    it('clears the redirect flag without restoring a trade when the transaction id is missing', () => {
        const store = renderExchangeFlow({ isFromRedirect: true, trade: TRADE });

        const types = actionTypes(store);

        expect(types).not.toContain(tradingExchangeActions.saveSelectedQuote.type);
        expect(types).not.toContain(tradingExchangeActions.setFormStep.type);
        expect(types).toContain(tradingExchangeActions.setIsFromRedirect.type);
    });

    it('does not restore anything when the redirect flag is not set', () => {
        const store = renderExchangeFlow({ trade: TRADE, transactionId: 'tx-1' });

        const types = actionTypes(store);

        expect(types).not.toContain(tradingExchangeActions.saveSelectedQuote.type);
        expect(types).not.toContain(tradingExchangeActions.setIsFromRedirect.type);
    });
});
