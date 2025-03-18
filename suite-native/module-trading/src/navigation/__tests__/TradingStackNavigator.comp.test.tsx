import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingStackNavigator } from '../TradingStackNavigator';

describe('TradingStackNavigator', () => {
    it('should render', async () => {
        const { getAllByText } = await renderWithStoreProviderAsync(<TradingStackNavigator />);

        expect(getAllByText('Buy').length).toBe(2);
    });
});
