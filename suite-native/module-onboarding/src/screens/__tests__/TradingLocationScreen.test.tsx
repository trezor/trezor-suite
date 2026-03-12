import { RouteProp } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { screen, userEvent } from '@suite-native/test-utils';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { TradingLocationScreen } from '../TradingLocationScreen';

const mockExitOnboardingFlow = jest.fn();
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
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

jest.mock('../../hooks/useExitOnboardingFlow', () => ({
    useExitOnboardingFlow: () => mockExitOnboardingFlow,
}));

describe('TradingLocationOnboardingScreen', () => {
    const renderTradingLocationScreen = () =>
        renderWithStoreProviderAsync(<TradingLocationScreen />);

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

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
        const { getByText } = await renderTradingLocationScreen();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText('Argentina'));

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
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
