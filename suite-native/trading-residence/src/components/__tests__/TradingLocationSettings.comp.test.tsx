import { Text } from '@suite-native/atoms';
import {
    TestStore,
    initStore,
    renderWithStoreProviderAsync,
    screen,
} from '@suite-native/test-utils';

import { TradingLocationSettings, TradingLocationSettingsProps } from '../TradingLocationSettings';

describe('TradingLocationSettings', () => {
    let store: TestStore;

    const renderTradingLocationSettings = (props: TradingLocationSettingsProps) =>
        renderWithStoreProviderAsync(<TradingLocationSettings {...props} />, { store });

    beforeEach(() => {
        store = initStore().store;
    });

    afterEach(() => {
        // make sure component is unmounted (FlashList otherwise might try to do some magic)
        screen.unmount();
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
