import { Text } from '@suite-native/atoms';
import { type TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingLocationSettings, type TradingLocationSettingsProps } from '../TradingLocationSettings';

describe('TradingLocationSettings', () => {
    let store: TestStore;

    const renderTradingLocationSettings = (props: TradingLocationSettingsProps) =>
        renderWithStoreProviderAsync(<TradingLocationSettings {...props} />, { store });

    beforeEach(async () => {
        store = (await initStore()).store;
    });

    it('should render all components', async () => {
        const { getByText } = await renderTradingLocationSettings({
            context: 'settings',
            children: <Text>Test Children</Text>,
        });

        expect(getByText('Test Children')).toBeOnTheScreen();
        expect(getByText('Trading is available')).toBeOnTheScreen();
        expect(getByText('Country of residence')).toBeOnTheScreen();
        expect(getByText('🇵🇱 Poland')).toBeOnTheScreen();
    });
});
