import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { type AggregatedAccountHistory, type GraphRange } from 'src/types/wallet/graph';

import { TransactionsGraph } from './TransactionsGraph';
import { extraDependenciesDesktopMock } from '../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const ACCOUNT = mockWalletAccount({ symbol: 'btc' });

// A single day interval (the '1d' range), which is empty for any account without a transaction today.
const DAY_RANGE: GraphRange = {
    label: 'day',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-01-01T23:59:59.999Z'),
    groupBy: 'day',
};
const DAY_TICKS = [1767225600]; // 2026-01-01T00:00:00Z

const DATA_POINT: AggregatedAccountHistory = {
    time: DAY_TICKS[0]!,
    txs: 1,
    sent: '0.1',
    received: '0.2',
    balance: '0.5',
    sentFiat: {},
    receivedFiat: {},
    balanceFiat: {},
};

const renderTransactionsGraph = ({
    data,
    isLoading,
}: {
    data: AggregatedAccountHistory[];
    isLoading: boolean;
}) => {
    const store = configureMockStore({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                transactions: { transactions: {}, phishing: {}, fetchStatusDetail: {} },
            },
        } as AppState,
    });

    const { container } = renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <TransactionsGraph
            variant="one-asset"
            account={ACCOUNT}
            data={data}
            isLoading={isLoading}
            localCurrency="usd"
            minMaxValues={[0, 0]}
            selectedRange={DAY_RANGE}
            xTicks={DAY_TICKS}
            receivedValueFn={entry => entry.received}
            sentValueFn={entry => entry.sent}
            balanceValueFn={entry => entry.balance}
        />,
    );

    return {
        isGraphRendered: container.querySelector('.recharts-responsive-container') !== null,
    };
};

describe('TransactionsGraph', () => {
    it('renders the graph for an interval without transactions', () => {
        const { isGraphRendered } = renderTransactionsGraph({ data: [], isLoading: false });

        expect(isGraphRendered).toBe(true);
    });

    it('renders the loading skeleton instead of the graph when there is nothing to show yet', () => {
        const { isGraphRendered } = renderTransactionsGraph({ data: [], isLoading: true });

        expect(isGraphRendered).toBe(false);
    });

    it('keeps the graph visible while it is being refetched', () => {
        const { isGraphRendered } = renderTransactionsGraph({
            data: [DATA_POINT],
            isLoading: true,
        });

        expect(isGraphRendered).toBe(true);
    });
});
