import { type CryptoId } from 'invity-api';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    initialState as tradingInitialState,
    tradingSellActions,
} from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';

import { useTradingTransactionClick } from './useTradingTransactionClick';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    gotoThunk: (payload: unknown) => ({ type: '@router/goto', payload }),
}));

const goto = (routeName: string) => ({ type: '@router/goto', payload: { routeName } });

const BITCOIN = 'bitcoin' as CryptoId;

const btcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcDescriptor'),
});

const buy: TradingTransactionBuy = {
    tradeType: 'buy',
    key: 'buy-key',
    date: '2026-01-01T00:00:00Z',
    data: { status: 'SUCCESS', orderId: 'buy-order' },
    selectedAccountKey: btcAccount.key,
    receiveAccountKey: btcAccount.key,
};

const exchange: TradingTransactionExchange = {
    tradeType: 'exchange',
    key: 'exchange-key',
    date: '2026-01-01T00:00:00Z',
    data: { status: 'SUCCESS', orderId: 'exchange-order' },
    sendAccountKey: btcAccount.key,
    receiveAccountKey: btcAccount.key,
};

const sell: TradingTransactionSell = {
    tradeType: 'sell',
    key: 'sell-key',
    date: '2026-01-01T00:00:00Z',
    data: { status: 'SUCCESS', orderId: 'sell-order' },
    sendAccountKey: btcAccount.key,
};

const submittedSell: TradingTransactionSell = {
    ...sell,
    data: {
        status: 'SUBMITTED',
        orderId: 'sell-order',
        amountInCrypto: true,
        fiatCurrency: 'EUR',
        cryptoCurrency: BITCOIN,
    },
};

const buildState = (): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [btcAccount],
        trading: {
            ...tradingInitialState,
            composedTransactionInfo: {
                selectedFee: 'custom',
                composed: { feePerByte: '999', fee: '12345' },
            },
        },
    },
});

const renderClickHandler = () => {
    const root = createTestCompositionRoot({
        extra: { services: { analytics: mockDesktopAnalytics() } },
        preloadedState: buildState(),
    });
    const { result } = renderHookWithStoreProvider(() => useTradingTransactionClick(), { root });

    return {
        click: (trade: TradingTransaction) => result.current(trade),
        getActions: () => root.services.getActions(),
    };
};

describe('useTradingTransactionClick', () => {
    it('opens the buy detail', () => {
        const { click, getActions } = renderClickHandler();

        click(buy);

        expect(getActions()).toEqual([
            tradingBuyActions.saveTransactionId('buy-key'),
            goto('wallet-trading-buy-detail'),
        ]);
    });

    it('opens the exchange detail', () => {
        const { click, getActions } = renderClickHandler();

        click(exchange);

        expect(getActions()).toEqual([
            tradingExchangeActions.saveTransactionId('exchange-key'),
            goto('wallet-trading-exchange-detail'),
        ]);
    });

    it('opens the sell detail for a finished sell', () => {
        const { click, getActions } = renderClickHandler();

        click(sell);

        expect(getActions()).toEqual([
            tradingSellActions.saveTransactionId('sell-key'),
            goto('wallet-trading-sell-detail'),
        ]);
    });

    it('resumes an interrupted sell with a default fee, not the one left in the slot', () => {
        const { click, getActions } = renderClickHandler();

        click(submittedSell);

        expect(getActions()).toEqual([
            tradingSellActions.saveTransactionId('sell-key'),
            tradingSellActions.saveQuoteRequest({
                amountInCrypto: true,
                fiatCurrency: 'EUR',
                cryptoCurrency: BITCOIN,
            }),
            tradingSellActions.setIsFromRedirect(true),
            tradingActions.saveComposedTransactionInfo({
                selectedFee: 'normal',
                composed: { feePerByte: '', fee: '' },
            }),
            goto('wallet-trading-sell-confirm'),
        ]);
    });

    it('opens the sell detail when an interrupted sell has no crypto currency', () => {
        const { click, getActions } = renderClickHandler();

        click({ ...submittedSell, data: { ...submittedSell.data, cryptoCurrency: undefined } });

        expect(getActions()).toEqual([
            tradingSellActions.saveTransactionId('sell-key'),
            goto('wallet-trading-sell-detail'),
        ]);
    });
});
