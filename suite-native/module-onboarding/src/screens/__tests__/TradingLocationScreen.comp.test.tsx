import { RouteProp } from '@react-navigation/core';

import { EventType, analytics } from '@suite-native/analytics';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProviderAsync, screen, userEvent } from '@suite-native/test-utils';

import { TradingLocationScreen } from '../TradingLocationScreen';

const mockExitOnboardingFlow = jest.fn();

jest.mock('@react-navigation/core', () => ({
    ...jest.requireActual('@react-navigation/core'),

    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

jest.mock('../../hooks/useExitOnboardingFlow', () => ({
    useExitOnboardingFlow: () => mockExitOnboardingFlow,
}));

describe('TradingLocationOnboardingScreen', () => {
    const renderTradingLocationScreen = () =>
        renderWithStoreProviderAsync(<TradingLocationScreen />);

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components', async () => {
        const { getByText, getByLabelText } = await renderTradingLocationScreen();

        expect(getByText('Trading is now available')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        expect(getByLabelText('Go back')).toBeOnTheScreen();
    });

    it('should log analytics event on country change', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        const { getByText } = await renderTradingLocationScreen();

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

    it('should use exitOnboardingFlow on button press', async () => {
        const { getByText } = await renderTradingLocationScreen();
        await userEvent.press(getByText('Not now'));

        expect(mockExitOnboardingFlow).toHaveBeenCalledTimes(1);
    });
});
