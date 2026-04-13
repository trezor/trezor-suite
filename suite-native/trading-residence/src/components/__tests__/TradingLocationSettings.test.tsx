import { Text } from '@suite-native/atoms';
import {
    type TestStore,
    initStore,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';

import {
    TradingLocationSettings,
    type TradingLocationSettingsProps,
} from '../TradingLocationSettings';

describe('TradingLocationSettings', () => {
    let store: TestStore;

    const renderTradingLocationSettings = (props: TradingLocationSettingsProps) =>
        renderWithStoreProvider(<TradingLocationSettings {...props} />, { store });

    beforeEach(() => {
        store = initStore().store;
    });

    afterEach(() => {
        // make sure component is unmounted (FlashList otherwise might try to do some magic)
        screen.unmount();
    });

    it('should render all components', () => {
        const { getByText } = renderTradingLocationSettings({
            context: 'settings',
            children: <Text>Test Children</Text>,
        });

        expect(getByText('Test Children')).toBeOnTheScreen();
        expect(getByText('Trading is available')).toBeOnTheScreen();
        expect(getByText('Country of residence')).toBeOnTheScreen();
        expect(getByText('🇵🇱 POL')).toBeOnTheScreen();
    });
});
