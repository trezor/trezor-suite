import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingStackNavigator } from '../TradingStackNavigator';

jest.mock('../../hooks/useTradingBuyData', () => ({
    useTradingBuyData: () => ({
        isLoading: true,
        lastLoadedTimestamp: 0,
    }),
}));

describe('TradingStackNavigator', () => {
    it('should render', async () => {
        const { getByText } = await renderWithStoreProviderAsync(<TradingStackNavigator />);

        expect(getByText('Buy')).toBeDefined();
    });
});
