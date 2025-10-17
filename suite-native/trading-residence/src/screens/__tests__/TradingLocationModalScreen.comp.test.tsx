import { RouteProp } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProviderAsync, userEvent } from '@suite-native/test-utils';

import { TradingLocationModalScreen } from '../TradingLocationModalScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

describe('TradingLocationModalScreen', () => {
    const renderTradingLocationModalScreen = () =>
        renderWithStoreProviderAsync(<TradingLocationModalScreen />);

    it('should render all components', async () => {
        const { getByText, queryByLabelText } = await renderTradingLocationModalScreen();

        expect(getByText('Confirm your location to enable trading')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        expect(queryByLabelText('Go back')).toBeNull();
    });

    it('should log analytics event on country change', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        const { getByText } = await renderTradingLocationModalScreen();

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
