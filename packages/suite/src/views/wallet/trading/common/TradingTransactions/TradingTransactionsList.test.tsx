import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Coins, type CryptoId } from 'invity-api';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingTransactionsList } from './TradingTransactionsList';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const BITCOIN = 'bitcoin' as CryptoId;
const ETHEREUM = 'ethereum' as CryptoId;
const DEVICE_STATIC_SESSION_ID = 'descriptor@deviceId:0' as StaticSessionId;

const coins = {
    bitcoin: {
        symbol: 'btc',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        services: { buy: true, sell: true, exchange: true },
    },
    ethereum: {
        symbol: 'eth',
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

const selectedDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const btcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcDescriptor'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});

const buy: TradingTransactionBuy = {
    tradeType: 'buy',
    key: 'buy-key',
    date: '2026-01-01T00:00:00Z',
    data: {
        orderId: 'buy-order',
        status: 'SUCCESS',
        fiatStringAmount: '1000',
        fiatCurrency: 'EUR',
        receiveStringAmount: '0.02',
        receiveCurrency: BITCOIN,
    },
    selectedAccountKey: btcAccount.key,
    receiveAccountKey: btcAccount.key,
};

const sell: TradingTransactionSell = {
    tradeType: 'sell',
    key: 'sell-key',
    date: '2026-01-02T00:00:00Z',
    data: {
        orderId: 'sell-order',
        status: 'SUCCESS',
        cryptoStringAmount: '0.5',
        cryptoCurrency: ETHEREUM,
        fiatStringAmount: '900',
        fiatCurrency: 'USD',
    },
    sendAccountKey: btcAccount.key,
};

const exchange: TradingTransactionExchange = {
    tradeType: 'exchange',
    key: 'exchange-key',
    date: '2026-01-03T00:00:00Z',
    data: {
        orderId: 'exchange-order',
        status: 'SUCCESS',
        sendStringAmount: '0.5',
        send: ETHEREUM,
        receiveStringAmount: '0.02',
        receive: BITCOIN,
    },
    sendAccountKey: btcAccount.key,
    receiveAccountKey: btcAccount.key,
};

const buildState = (trades: TradingTransaction[]): AppState => ({
    ...mockInitialAppState,
    device: { ...mockInitialAppState.device, selectedDevice },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [btcAccount],
        trading: {
            ...tradingInitialState,
            info: { ...tradingInitialState.info, coins },
            trades,
        },
    },
});

const renderList = (trades: TradingTransaction[]) => {
    const root = createTestCompositionRoot({
        extra: {
            services: {
                analytics: mockDesktopAnalytics(),
                suiteRouterHistory: { ...mockSuiteRouterHistory(), navigate: jest.fn() },
            },
        },
        preloadedState: buildState(trades),
    });

    return renderWithProviders(root, <TradingTransactionsList />);
};

const getRowOrderIds = () =>
    screen
        .getAllByTestId(/^@trading\/transactions\/trade\//)
        .map(row => row.dataset.testid?.split('/').pop());

const selectTab = (tradeType: string) =>
    userEvent.click(screen.getByTestId(`@trading/transactions/tab/${tradeType}`));

describe('TradingTransactionsList', () => {
    it('renders every trade, newest first', () => {
        renderList([buy, sell, exchange]);

        expect(getRowOrderIds()).toEqual(['exchange-order', 'sell-order', 'buy-order']);
    });

    it('renders only the trades of the selected type', async () => {
        renderList([buy, sell, exchange]);

        await selectTab('sell');

        expect(getRowOrderIds()).toEqual(['sell-order']);
    });

    it('offers a way back to all trades when the selected type has none', async () => {
        renderList([buy]);

        await selectTab('exchange');

        expect(screen.getByTestId('@trading/transactions/type-empty-state')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('@trading/transactions/show-all-trades'));

        expect(getRowOrderIds()).toEqual(['buy-order']);
        expect(
            screen.queryByTestId('@trading/transactions/type-empty-state'),
        ).not.toBeInTheDocument();
    });

    it('skips a trade that has no amount on one of its sides', () => {
        renderList([
            buy,
            {
                ...exchange,
                key: 'no-amount',
                data: { ...exchange.data, receiveStringAmount: undefined },
            },
        ]);

        expect(getRowOrderIds()).toEqual(['buy-order']);
    });

    it('renders a trade without an order id, leaving it without a testid', () => {
        renderList([buy, { ...sell, data: { ...sell.data, orderId: undefined } }]);

        expect(getRowOrderIds()).toEqual(['buy-order']);
        expect(screen.getAllByTestId('@trading/transactions/date')).toHaveLength(2);
    });
});
