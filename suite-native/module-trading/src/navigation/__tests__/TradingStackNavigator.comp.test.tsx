import { renderWithStore, waitFor } from '@suite-native/test-utils';

import { TradingStackNavigator } from '../TradingStackNavigator';

describe('TradingStackNavigator', () => {
    it('should render', async () => {
        const { getByText } = renderWithStore(<TradingStackNavigator />);
        await waitFor(() => expect(getByText('Trading placeholder')).toBeDefined());
    });
});
