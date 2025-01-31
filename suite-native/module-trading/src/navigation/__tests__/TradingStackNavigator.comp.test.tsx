import { renderWithStore, waitFor } from '@suite-native/test-utils';

import { TradingStackNavigator } from '../TradingStackNavigator';

describe('TradingStackNavigator', () => {
    it('should render', async () => {
        const { getAllByText } = renderWithStore(<TradingStackNavigator />);
        await waitFor(() => expect(getAllByText('Buy').length).toBe(2));
    });
});
