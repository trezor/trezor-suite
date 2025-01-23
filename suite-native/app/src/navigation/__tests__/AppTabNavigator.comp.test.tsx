import { renderWithStore, waitFor } from '@suite-native/test-utils';

import { AppTabNavigator } from '../AppTabNavigator';

describe('AppTabNavigator', () => {
    it('should render 3 buttons', async () => {
        const { getByText } = renderWithStore(<AppTabNavigator />);
        await waitFor(() => expect(getByText('Home')).toBeDefined());

        expect(getByText('Home')).toBeDefined();
        expect(getByText('My assets')).toBeDefined();
        expect(getByText('Settings')).toBeDefined();
    });
});
