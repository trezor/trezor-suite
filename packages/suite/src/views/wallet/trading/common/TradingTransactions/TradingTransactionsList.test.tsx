import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';
import {
    type Account,
    type SelectedAccountStatus,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingTransactionsList } from './TradingTransactionsList';
import { extraDependenciesDesktopMock } from '../../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/tx-simulation', () => ({}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id, values }: { id: string; values?: Record<string, unknown> }) => (
        <span data-testid={id}>{values ? JSON.stringify(values) : id}</span>
    ),
}));

jest.mock('src/views/wallet/trading/common/TradingTransactions/TradingTransactionsBuy', () => ({
    TradingTransactionBuy: ({ trade }: { trade: { key?: string } }) => (
        <div data-testid={`@trading/transactions/buy/${trade.key}`} />
    ),
}));

jest.mock('src/views/wallet/trading/common/TradingTransactions/TradingTransactionsSell', () => ({
    TradingTransactionSell: ({ trade }: { trade: { key?: string } }) => (
        <div data-testid={`@trading/transactions/sell/${trade.key}`} />
    ),
}));

jest.mock('src/views/wallet/trading/common/TradingTransactions/TradingTransactionExchange', () => ({
    TradingTransactionExchange: ({ trade }: { trade: { key?: string } }) => (
        <div data-testid={`@trading/transactions/exchange/${trade.key}`} />
    ),
}));

const DEVICE_SSID = 'btcAddress@deviceId:0' as const;
const SELECTED_DEVICE = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: DEVICE_SSID },
});

const ACCOUNT_KEY = createAccountKey({
    accountDescriptor: asAccountDescriptor('btcDescriptor'),
    networkSymbol: 'btc',
    deviceStaticSessionId: DEVICE_SSID,
});

const btcAccount = {
    key: ACCOUNT_KEY,
    deviceState: DEVICE_SSID,
    accountType: 'normal',
    visible: true,
    empty: false,
    symbol: 'btc',
    networkType: 'bitcoin',
} as unknown as Account;

const BUY_TRADE = {
    date: '2026-01-02T00:00:00Z',
    key: 'buy-1',
    tradeType: 'buy' as const,
    data: {},
    selectedAccountKey: ACCOUNT_KEY,
    receiveAccountKey: ACCOUNT_KEY,
};

const SELL_TRADE = {
    date: '2026-01-01T00:00:00Z',
    key: 'sell-1',
    tradeType: 'sell' as const,
    data: {},
    sendAccountKey: ACCOUNT_KEY,
};

const EXCHANGE_TRADE = {
    date: '2026-01-03T00:00:00Z',
    key: 'exchange-1',
    tradeType: 'exchange' as const,
    data: {},
    sendAccountKey: ACCOUNT_KEY,
    receiveAccountKey: ACCOUNT_KEY,
};

type BuildStateParams = {
    selectedAccountStatus?: SelectedAccountStatus;
    trades?: (typeof BUY_TRADE | typeof SELL_TRADE | typeof EXCHANGE_TRADE)[];
};

const buildState = ({
    selectedAccountStatus = {
        status: 'loaded',
        account: btcAccount,
        network: { symbol: 'btc' } as any,
        params: {} as any,
    },
    trades = [],
}: BuildStateParams = {}) => ({
    ...mockInitialAppState,
    device: {
        ...mockInitialAppState.device,
        selectedDevice: SELECTED_DEVICE,
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [btcAccount],
        selectedAccount: selectedAccountStatus,
        trading: {
            ...tradingInitialState,
            trades: trades as any,
        },
    } as any,
});

describe('TradingTransactionsList', () => {
    it('renders nothing when selectedAccount is not loaded', () => {
        const store = configureMockStore({
            preloadedState: buildState({
                selectedAccountStatus: { status: 'loading', loader: 'account-loading' },
            }),
        });

        const { container } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingTransactionsList />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('renders empty state when there are no trades', () => {
        const store = configureMockStore({ preloadedState: buildState({ trades: [] }) });

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingTransactionsList />,
        );

        expect(screen.getByTestId('@trading/transactions/list')).toBeInTheDocument();
        expect(screen.getByTestId('@trading/transactions/no-transaction')).toBeInTheDocument();
        expect(screen.queryByTestId('@trading/transactions/count')).not.toBeInTheDocument();
    });

    it('renders correct transaction counts and trade rows when there are trades', () => {
        const store = configureMockStore({
            preloadedState: buildState({ trades: [BUY_TRADE, SELL_TRADE, EXCHANGE_TRADE] }),
        });

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingTransactionsList />,
        );

        expect(
            screen.queryByTestId('@trading/transactions/no-transaction'),
        ).not.toBeInTheDocument();

        expect(screen.getByTestId('TR_TRADING_TRADE_HISTORY_COUNTER')).toHaveTextContent(
            JSON.stringify({ totalBuys: 1, totalSells: 1, totalSwaps: 1 }),
        );

        expect(screen.getByTestId('@trading/transactions/buy/buy-1')).toBeInTheDocument();
        expect(screen.getByTestId('@trading/transactions/sell/sell-1')).toBeInTheDocument();
        expect(screen.getByTestId('@trading/transactions/exchange/exchange-1')).toBeInTheDocument();
    });
});
