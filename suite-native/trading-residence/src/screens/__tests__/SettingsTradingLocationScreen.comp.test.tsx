import { RouteProp } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { SettingsStackParamList, SettingsStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProviderAsync, screen, userEvent } from '@suite-native/test-utils';

import { SettingsTradingLocationScreen } from '../SettingsTradingLocationScreen';

const mockNavigationGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<SettingsStackParamList, SettingsStackRoutes.SettingsTradingLocation>,
    useNavigation: () => ({
        goBack: () => mockNavigationGoBack(),
        setOptions: jest.fn(),
    }),
}));

describe('TradingLocationSettingsScreen', () => {
    const renderTradingLocationSettingsScreen = () =>
        renderWithStoreProviderAsync(<SettingsTradingLocationScreen />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components', async () => {
        const { getByText, queryByText, getByLabelText } =
            await renderTradingLocationSettingsScreen();

        expect(getByText('Trading is now available')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(queryByText('Not now')).toBeNull();

        expect(getByLabelText('Go back')).toBeOnTheScreen();
    });

    it('should goBack on `Confirm location` press', async () => {
        const { getByText } = await renderTradingLocationSettingsScreen();

        await userEvent.press(getByText('Confirm location'));

        expect(mockNavigationGoBack).toHaveBeenCalledTimes(1);
    });

    it('should log analytics event on country change', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        const { getByText } = await renderTradingLocationSettingsScreen();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText('🇦🇷 Argentina'));

        expect(analyticsSpy).toHaveBeenCalledTimes(1);
        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'settings',
                parameter: 'country',
            },
        });
    });

    it('should go back and log analytics event on back button press', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        const { getByLabelText } = await renderTradingLocationSettingsScreen();

        await userEvent.press(getByLabelText('Go back'));

        expect(analyticsSpy).toHaveBeenCalledTimes(1);
        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingCountrySelection,
            payload: {
                type: 'settings',
                action: 'cancel',
            },
        });
    });
});
