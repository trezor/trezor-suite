import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen } from '@testing-library/react';

import { setAssetPriceChartRange } from '@suite/flags';
import {
    AssetPriceChartRange,
    type AssetPricePoint,
    INITIAL_ASSET_PRICE_CHART_RANGE,
    useAssetPriceHistoryQuery,
} from '@suite-common/price-chart';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailMarketPrice } from './AssetDetailMarketPrice';
import { ETH, ETH_ASSET_KEY, getEthAssetState } from './assetDetailTestState';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/price-chart', () => ({
    ...jest.requireActual('@suite-common/price-chart'),
    useAssetPriceHistoryQuery: jest.fn(),
}));

const mockUseAssetPriceHistoryQuery = jest.mocked(useAssetPriceHistoryQuery);

const historyQuery = (data: AssetPricePoint[] | null | undefined, isLoading = false) =>
    ({ data, isLoading }) as ReturnType<typeof useAssetPriceHistoryQuery>;

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
    chartRange?: AssetPriceChartRange;
};

const getInitialState = ({
    ethRate,
    ethWeekAgoRate,
    chartRange = INITIAL_ASSET_PRICE_CHART_RANGE,
}: InitialStateParams): AppState => ({
    ...getEthAssetState({
        accounts: [mockWalletAccount({ symbol: ETH, formattedBalance: '2' })],
        ethRate,
        ethWeekAgoRate,
    }),
    flags: { ...mockInitialAppState.flags, assetPriceChartRange: chartRange },
});

const renderMarketPrice = (state: AppState) => {
    const { services } = createTestCompositionRoot<void, AppState>({ preloadedState: state });

    renderWithProviders(services, <AssetDetailMarketPrice assetKey={ETH_ASSET_KEY} />);

    return services;
};

describe('the market price on the asset screen', () => {
    beforeEach(() => {
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

    it('is left out for an asset the market does not price, leaving the balance card alone', () => {
        renderMarketPrice(getInitialState({}));

        expect(screen.queryByTestId('@asset-detail/market-price')).not.toBeInTheDocument();
    });

    describe('the price chart in it', () => {
        it("draws the week's price history", () => {
            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@price-chart/graph')).toBeInTheDocument();
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
        });

        it('holds its place with a skeleton while the history loads', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(undefined, true));

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@price-chart/skeleton')).toBeInTheDocument();
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
        });

        it('is left out for an asset without a price history, leaving the price alone', () => {
            mockUseAssetPriceHistoryQuery.mockReturnValue(historyQuery(null));

            renderMarketPrice(getInitialState({ ethRate: 3000 }));

            expect(screen.getByTestId('@asset-detail/market-price')).toHaveTextContent('$3,000');
            expect(screen.queryByTestId('@price-chart/graph')).not.toBeInTheDocument();
        });
    });
});
