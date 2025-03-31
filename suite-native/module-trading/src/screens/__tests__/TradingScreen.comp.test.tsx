import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingScreen } from '../TradingScreen';

let mockUseTradingBuyDataValue: { isLoading: boolean; lastLoadedTimestamp: number };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingScreen' }),
}));

jest.mock('../../hooks/useTradingBuyData', () => ({
    useTradingBuyData: () => mockUseTradingBuyDataValue,
}));

const stateWithEnabledBuy = {
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingBuyEnabled]: true,
    },
};

const stateWithDisabledBuy = {
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingBuyEnabled]: false,
    },
};

describe('TradingScreen', () => {
    beforeEach(() => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 0 };
    });

    const renderTradingScreen = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<TradingScreen />, { preloadedState });

    it('should render Buy skeleton when isLoading is true', async () => {
        mockUseTradingBuyDataValue = { isLoading: true, lastLoadedTimestamp: 1 };

        const { getAllByText } = await renderTradingScreen(stateWithEnabledBuy);

        expect(getAllByText('Buy').length).toBe(1);
    });

    it('should render Buy skeleton when lastLoadedTimestamp is 0', async () => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 0 };

        const { getAllByText } = await renderTradingScreen(stateWithEnabledBuy);

        expect(getAllByText('Buy').length).toBe(1);
    });

    it('should render Buy form when isLoading is false and lastLoadedTimestamp is greater than 0', async () => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 1 };

        const { getAllByText } = await renderTradingScreen(stateWithEnabledBuy);

        expect(getAllByText('Buy').length).toBe(2);
    });

    it('should not render Buy form when feature flag is not enabled', async () => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 1 };

        const { queryByText } = await renderTradingScreen(stateWithDisabledBuy);

        expect(queryByText('Buy')).toBeNull();
    });
});
