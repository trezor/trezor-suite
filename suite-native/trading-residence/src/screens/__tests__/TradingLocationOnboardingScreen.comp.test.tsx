import { RouteProp } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProviderAsync, userEvent } from '@suite-native/test-utils';

import { TradingLocationOnboardingScreen } from '../TradingLocationOnboardingScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

describe('TradingLocationOnboardingScreen', () => {
    const renderTradingLocationOnboardingScreen = () =>
        renderWithStoreProviderAsync(<TradingLocationOnboardingScreen />);

    it('should render all components', async () => {
        const { getByText, getByLabelText } = await renderTradingLocationOnboardingScreen();

        expect(getByText('Confirm your location to enable trading')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        expect(getByLabelText('Go back')).toBeOnTheScreen();
    });

    it('should log analytics event on country change', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        const { getByText } = await renderTradingLocationOnboardingScreen();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText('🇦🇷 Argentina'));

        expect(analyticsSpy).toHaveBeenCalledTimes(1);
        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'onboarding',
                parameter: 'country',
            },
        });
    });
});
