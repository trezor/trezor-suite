import { type RouteProp } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { renderWithStoreProvider, screen, userEvent } from '@suite-native/test-utils-store';

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
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingHistory>,
}));

jest.mock('../../hooks/useExitOnboardingFlow', () => ({
    useExitOnboardingFlow: () => mockExitOnboardingFlow,
}));

const defaultMessageSystem = {
    config: { actions: [] },
    validMessages: { banner: [], context: [], modal: [], feature: [] },
    dismissedMessages: [],
};

describe('TradingLocationOnboardingScreen', () => {
    const renderTradingLocationScreen = () =>
        renderWithStoreProvider(<TradingLocationScreen />, {
            preloadedState: {
                messageSystem: defaultMessageSystem,
                wallet: {
                    trading: { residence: { country: null, wasOnboardingVisited: false } },
                },
                device: { selectedDevice: undefined, devices: [] },
                featureFlags: {},
            },
        });

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
        const { getByText, getByLabelText } = renderTradingLocationScreen();

        expect(getByText('Trading is now available')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        expect(getByLabelText('Go back')).toBeOnTheScreen();
    });

    it('should log analytics event on country change', async () => {
        const { getByText } = renderTradingLocationScreen();

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
        const { getByText } = renderTradingLocationScreen();
        await userEvent.press(getByText('Not now'));

        expect(mockExitOnboardingFlow).toHaveBeenCalledTimes(1);
    });
});
