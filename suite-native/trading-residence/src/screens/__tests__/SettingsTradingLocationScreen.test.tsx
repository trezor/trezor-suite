import { type RouteProp } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { type SettingsStackParamList, type SettingsStackRoutes } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { renderWithStoreProvider, screen, userEvent } from '@suite-native/test-utils-store';

import { SettingsTradingLocationScreen } from '../SettingsTradingLocationScreen';

const mockNavigationGoBack = jest.fn();
const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

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
        renderWithStoreProvider(<SettingsTradingLocationScreen />);

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components', () => {
        const { getByText, queryByText, getByLabelText } = renderTradingLocationSettingsScreen();

        expect(getByText('Trading is now available')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(queryByText('Not now')).toBeNull();

        expect(getByLabelText('Go back')).toBeOnTheScreen();
    });

    it('should goBack on `Confirm location` press', async () => {
        const { getByText } = renderTradingLocationSettingsScreen();

        await userEvent.press(getByText('Confirm location'));

        expect(mockNavigationGoBack).toHaveBeenCalledTimes(1);
    });

    it('should log analytics event on country change', async () => {
        const { getByText } = renderTradingLocationSettingsScreen();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText('Argentina'));

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'settings',
                parameter: 'country',
            },
        });
    });

    it('should go back and log analytics event on back button press', async () => {
        const { getByLabelText } = renderTradingLocationSettingsScreen();

        await userEvent.press(getByLabelText('Go back'));

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingCountrySelectionEvent.name,
            payload: {
                type: 'settings',
                action: 'cancel',
            },
        });
    });
});
