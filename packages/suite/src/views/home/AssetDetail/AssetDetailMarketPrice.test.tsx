import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailMarketPrice } from './AssetDetailMarketPrice';
import { ETH, ETH_ASSET_KEY, getEthAssetState } from './assetDetailTestState';

type InitialStateParams = {
    /** What one ether costs, if the market prices it at all. */
    ethRate?: number;
    /** What it cost a week ago. */
    ethWeekAgoRate?: number;
};

const getInitialState = ({ ethRate, ethWeekAgoRate }: InitialStateParams): AppState =>
    getEthAssetState({
        accounts: [mockWalletAccount({ symbol: ETH, formattedBalance: '2' })],
        ethRate,
        ethWeekAgoRate,
    });

const renderMarketPrice = (state: AppState) => {
    const { services } = createTestCompositionRoot<void, AppState>({ preloadedState: state });

    renderWithProviders(services, <AssetDetailMarketPrice assetKey={ETH_ASSET_KEY} />);
};

describe('the market price on the asset screen', () => {
    it('says what one unit of the asset costs', () => {
        renderMarketPrice(getInitialState({ ethRate: 3000 }));

        expect(screen.getByTestId('@asset-detail/market-price')).toHaveTextContent('$3,000');
    });

    it('says how the price moved over the week, as the Home total does', () => {
        renderMarketPrice(getInitialState({ ethRate: 3000, ethWeekAgoRate: 2500 }));

        const weekChange = screen.getByTestId('@asset-detail/market-price/week-change');

        expect(weekChange).toHaveTextContent('$500');
        expect(weekChange).toHaveTextContent('20');
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
});
