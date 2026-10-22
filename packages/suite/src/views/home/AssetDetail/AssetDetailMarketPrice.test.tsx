import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type CurrentRate, type Timestamp } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailMarketPrice } from './AssetDetailMarketPrice';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');

const ETH_ASSET_KEY = getWalletAssetKey({ deviceState: DEVICE_STATE, symbol: ETH });

// In dollars, the dollar rate is the rate itself.
const mockRate = (rate: number) =>
    ({
        rate,
        usdRate: rate,
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading: false,
        error: null,
    }) as CurrentRate;

type InitialStateParams = {
    /** What one ether costs, if the market prices it at all. */
    ethRate?: number;
    /** What it cost a week ago. */
    ethWeekAgoRate?: number;
};

const getInitialState = ({ ethRate, ethWeekAgoRate }: InitialStateParams): AppState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [mockWalletAccount({ symbol: ETH, formattedBalance: '2' })],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [ETH],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current:
                ethRate === undefined ? {} : { [getFiatRateKey(ETH, 'usd')]: mockRate(ethRate) },
            lastWeek:
                ethWeekAgoRate === undefined
                    ? {}
                    : { [getFiatRateKey(ETH, 'usd')]: mockRate(ethWeekAgoRate) },
        },
    },
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
