import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen } from '@testing-library/react';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { setAssetPriceChartRange } from '@suite/flags';
import { messages } from '@suite/intl';
import {
    AssetPriceChartRange,
    type AssetPricePoint,
    INITIAL_ASSET_PRICE_CHART_RANGE,
    useAssetPriceHistoryQuery,
} from '@suite-common/price-chart';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailMarketPrice } from './AssetDetailMarketPrice';
import { ETH, type PendingRateStatus, getEthAssetState } from './assetDetailTestState';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/price-chart', () => ({
    ...jest.requireActual('@suite-common/price-chart'),
    useAssetPriceHistoryQuery: jest.fn(),
}));

const mockUseAssetPriceHistoryQuery = jest.mocked(useAssetPriceHistoryQuery);

const historyQuery = (data: AssetPricePoint[] | null | undefined, isLoading = false) =>
    ({ data, isLoading }) as ReturnType<typeof useAssetPriceHistoryQuery>;

const failedHistoryQuery = (data?: AssetPricePoint[], isFetching = false) =>
    ({ data, isLoading: false, isError: true, isFetching }) as ReturnType<
        typeof useAssetPriceHistoryQuery
    >;

const PRICE_HISTORY: AssetPricePoint[] = [
    { timestamp: 1700000000000, price: 2900 },
    { timestamp: 1700086400000, price: 3000 },
];

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

type InitialStateParams = {
    /** What one ether costs, if the market prices it at all. */
    ethRate?: number;
    /** What it cost a week ago. */
    ethWeekAgoRate?: number;
    /** Where the price stands while there is no `ethRate`; no entry at all when left out. */
    ethRateStatus?: PendingRateStatus;
    chartRange?: AssetPriceChartRange;
    /** Tokens with a known definition, the only ones whose price is ever fetched. */
    knownTokens?: TokenAddress[];
};

const getInitialState = ({
    ethRate,
    ethWeekAgoRate,
    ethRateStatus,
    chartRange = INITIAL_ASSET_PRICE_CHART_RANGE,
    knownTokens = [],
}: InitialStateParams): MockSuiteState => ({
    ...getEthAssetState({
        accounts: [mockWalletAccount({ symbol: ETH, formattedBalance: '2' })],
        ethRate,
        ethWeekAgoRate,
        ethRateStatus,
    }),
    tokenDefinitions: {
        [ETH]: {
            coin: { data: knownTokens, error: false, isLoading: false, hide: [], show: [] },
        },
    },
    flags: { ...mockInitialAppState.flags, assetPriceChartRange: chartRange },
});

const mockReport = jest.fn();

const renderMarketPrice = (state: MockSuiteState, contractAddress?: TokenAddress) => {
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: state,
        services: () => ({ analytics: mockDesktopAnalytics(mockReport) }),
    });

    renderWithProviders(
        services,
        <AssetDetailMarketPrice symbol={ETH} contractAddress={contractAddress} />,
    );

    return services;
};

describe('the market price on the asset screen', () => {
    beforeEach(() => {
        mockReport.mockClear();
        mockUseAssetPriceHistoryQuery.mockReset();
        mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(PRICE_HISTORY));
    });

    it('says what one unit of the asset costs', () => {
        renderMarketPrice(getInitialState({ ethRate: 3000 }));

        expect(screen.getByTestId('@asset-detail/market-price')).toHaveTextContent('$3,000');
    });

    it('shows a price with every decimal it has', () => {
        renderMarketPrice(getInitialState({ ethRate: 0.0000123456 }));

        expect(screen.getByTestId('@asset-detail/market-price/fiat-amount')).toHaveTextContent(
            '$0.0000123456',
        );
    });

    it('says how the price moved over the week, as the Home total does', () => {
        renderMarketPrice(getInitialState({ ethRate: 3000, ethWeekAgoRate: 2500 }));

        const weekChange = screen.getByTestId('@asset-detail/market-price/week-change');

        expect(weekChange).toHaveTextContent('$500');
        expect(weekChange).toHaveTextContent('20');
    });

    it('shows a price change below a cent with every decimal it has', () => {
        renderMarketPrice(getInitialState({ ethRate: 0.00003, ethWeekAgoRate: 0.00001 }));

        expect(screen.getByTestId('@asset-detail/market-price/week-change')).toHaveTextContent(
            '$0.00002',
        );
    });

    it('says nothing of the week while last week has no price', () => {
        renderMarketPrice(getInitialState({ ethRate: 3000 }));

        expect(
            screen.queryByTestId('@asset-detail/market-price/week-change'),
        ).not.toBeInTheDocument();
    });

    it('keeps the public price and its change visible in discreet mode', () => {
        renderMarketPrice({
            ...getInitialState({ ethRate: 3000, ethWeekAgoRate: 2500 }),
            discreetMode: { isActive: true },
        });

        expect(screen.getByTestId('@asset-detail/market-price/fiat-amount')).toHaveTextContent(
            '$3,000',
        );
        expect(screen.getByTestId('@asset-detail/market-price/week-change')).toHaveTextContent(
            '$500',
        );
    });

    it('is left out for an asset the market does not price, leaving the balance card alone', () => {
        mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(null));

        renderMarketPrice(getInitialState({ ethRateStatus: 'failed' }));

        expect(screen.queryByTestId('@asset-detail/market-price')).not.toBeInTheDocument();
    });

    it('holds the place of the price and the chart with skeletons while both load', () => {
        mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(undefined, true));

        renderMarketPrice(getInitialState({ ethRateStatus: 'loading' }));

        expect(screen.getByTestId('@asset-detail/market-price/skeleton')).toBeInTheDocument();
        expect(screen.getByTestId('@price-chart/skeleton')).toBeInTheDocument();
    });

    it('keeps the chart skeleton while a failed history loads again, without a price', () => {
        mockUseAssetPriceHistoryQuery.mockReturnValue(failedHistoryQuery(undefined, true));

        renderMarketPrice(getInitialState({ ethRateStatus: 'loading' }));

        expect(screen.getByTestId('@price-chart/skeleton')).toBeInTheDocument();
    });

    describe('is left out when the price failed, rather than showing a card without a price or a chart', () => {
        it.each([
            { title: 'while the history loads', query: historyQuery(undefined, true) },
            { title: 'when the history failed', query: failedHistoryQuery() },
            { title: 'when there is no history for the period', query: historyQuery([]) },
        ])('$title', ({ query }) => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(query);

            renderMarketPrice(getInitialState({ ethRateStatus: 'failed' }));

            expect(screen.queryByTestId('@asset-detail/market-price')).not.toBeInTheDocument();
        });
    });

    it('keeps the chart with an earlier history when loading it again failed, even without a price', () => {
        mockUseAssetPriceHistoryQuery.mockReturnValue(failedHistoryQuery(PRICE_HISTORY));

        renderMarketPrice(getInitialState({ ethRateStatus: 'failed' }));

        expect(screen.getByTestId('@price-chart/error')).toBeInTheDocument();
        expect(screen.getByTestId('@price-chart/range')).toBeInTheDocument();
    });

    describe.each<{ title: string; ethRateStatus?: PendingRateStatus }>([
        { title: 'while the price is loading', ethRateStatus: 'loading' },
        // Rates load a few tickers at a time, so most tokens wait without an entry at all.
        { title: 'while the price has not been asked for yet', ethRateStatus: undefined },
    ])('$title', ({ ethRateStatus }) => {
        it('holds the place of the price with a skeleton', () => {
            renderMarketPrice(getInitialState({ ethRateStatus }));

            expect(screen.getByTestId('@asset-detail/market-price/skeleton')).toBeInTheDocument();
            expect(
                screen.queryByTestId('@asset-detail/market-price/fiat-amount'),
            ).not.toBeInTheDocument();
        });

        it('draws the price history without waiting for the price', async () => {
            renderMarketPrice(getInitialState({ ethRateStatus }));

            expect(await screen.findByTestId('@price-chart/graph')).toBeInTheDocument();
            expect(screen.getByTestId('@price-chart/range')).toBeInTheDocument();
        });
    });

    describe('for a token', () => {
        const TOKEN = '0x1000000000000000000000000000000000000001' as TokenAddress;

        it('holds the place of the price with a skeleton while a known token waits for its price', () => {
            renderMarketPrice(getInitialState({ knownTokens: [TOKEN] }), TOKEN);

            expect(screen.getByTestId('@asset-detail/market-price/skeleton')).toBeInTheDocument();
        });

        it('draws the price history of a token whose price is never fetched, without a price skeleton', async () => {
            renderMarketPrice(getInitialState({}), TOKEN);

            expect(await screen.findByTestId('@price-chart/graph')).toBeInTheDocument();
            expect(
                screen.queryByTestId('@asset-detail/market-price/skeleton'),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByTestId('@asset-detail/market-price/fiat-amount'),
            ).not.toBeInTheDocument();
        });

        it.each([
            { title: 'while the history loads', query: historyQuery(undefined, true) },
            { title: 'when there is no price history', query: historyQuery(null) },
        ])('is left out for a token whose price is never fetched $title', ({ query }) => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(query);

            renderMarketPrice(getInitialState({}), TOKEN);

            expect(screen.queryByTestId('@asset-detail/market-price')).not.toBeInTheDocument();
        });
    });

    it('draws the price history of an asset whose price failed to load, without a price', async () => {
        renderMarketPrice(getInitialState({ ethRateStatus: 'failed' }));

        expect(await screen.findByTestId('@price-chart/graph')).toBeInTheDocument();
        expect(
            screen.queryByTestId('@asset-detail/market-price/fiat-amount'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('@asset-detail/market-price/skeleton')).not.toBeInTheDocument();
    });

    describe('the price chart in it', () => {
        it("draws the week's price history", async () => {
            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(await screen.findByTestId('@price-chart/graph')).toBeInTheDocument();
            expect(mockUseAssetPriceHistoryQuery).toHaveBeenLastCalledWith({
                ticker: { symbol: ETH, tokenAddress: undefined },
                fiatCurrency: 'usd',
                range: INITIAL_ASSET_PRICE_CHART_RANGE,
            });
        });

        it('draws the range picked last time', () => {
            renderMarketPrice(
                getInitialState({ ethRate: 3000, chartRange: AssetPriceChartRange.Month }),
            );

            expect(mockUseAssetPriceHistoryQuery).toHaveBeenLastCalledWith(
                expect.objectContaining({ range: AssetPriceChartRange.Month }),
            );
        });

        it('lets another range be picked', () => {
            const { store } = renderMarketPrice(getInitialState({ ethRate: 3000 }));

            fireEvent.click(screen.getByTestId('@price-chart/range/1m'));

            expect(store.getActions()).toContainEqual(
                setAssetPriceChartRange(AssetPriceChartRange.Month),
            );
            expect(mockReport).toHaveBeenCalledWith({
                type: events.assetsTimeframeChangeEvent.name,
                payload: { timeframe: AssetPriceChartRange.Month, networkSymbol: ETH },
            });
        });

        it('holds its place with a skeleton while the history loads', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(undefined, true));

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@price-chart/skeleton')).toBeInTheDocument();
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
            expect(screen.getByTestId('@price-chart/range')).toBeInTheDocument();
        });

        it('says the history failed to load, offers to refresh it and keeps the range picker, so another range can be picked', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(failedHistoryQuery());

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@price-chart/error')).toBeInTheDocument();
            expect(screen.getByTestId('@price-chart/refresh')).toHaveTextContent(
                messages.REFRESH.defaultMessage,
            );
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
            expect(screen.getByTestId('@price-chart/range')).toBeInTheDocument();
        });

        it('holds its place with a skeleton while a failed range loads again, even when an earlier history is kept', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(failedHistoryQuery(PRICE_HISTORY, true));

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@price-chart/skeleton')).toBeInTheDocument();
            expect(screen.queryByTestId('@price-chart/error')).not.toBeInTheDocument();
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
        });

        it('says there is no history for the period and keeps the range picker, so another range can be picked', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery([]));

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@price-chart/empty')).toBeInTheDocument();
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
            expect(screen.getByTestId('@price-chart/range')).toBeInTheDocument();
        });

        it('is left out with its range picker for an asset without a price history, leaving the price alone', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(null));

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@asset-detail/market-price')).toHaveTextContent('$3,000');
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
            expect(screen.queryByTestId('@price-chart/range')).not.toBeInTheDocument();
        });
    });
});
