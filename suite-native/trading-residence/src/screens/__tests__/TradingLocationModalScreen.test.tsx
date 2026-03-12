import { RouteProp } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import {
    RootStackRoutes,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { screen, userEvent } from '@suite-native/test-utils';
import { renderWithStoreProvider } from '@suite-native/test-utils/store';

import {
    TradingLocationModalScreen,
    TradingLocationModalScreenProps,
} from '../TradingLocationModalScreen';

const mockNavigationDispatch = jest.fn();
const reportMock = jest.fn();

const mockRoute: TradingLocationModalScreenProps['route'] = {
    name: RootStackRoutes.TradingLocationModal,
    key: 'TradingLocationModal',
    params: undefined,
};

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
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
    }),
}));

describe('TradingLocationModalScreen', () => {
    const renderTradingLocationModalScreen = () =>
        renderWithStoreProvider(
            <TradingLocationModalScreen
                navigation={
                    {
                        dispatch: mockNavigationDispatch,
                    } as unknown as TradingLocationModalScreenProps['navigation']
                }
                route={mockRoute}
            />,
        );

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
        const { getByText, queryByLabelText } = renderTradingLocationModalScreen();

        expect(getByText('Trading is now available')).toBeOnTheScreen();
        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        expect(queryByLabelText('Go back')).toBeNull();
    });

    it('should log analytics event on country change', async () => {
        const { getByText } = renderTradingLocationModalScreen();

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

    it('should reset navigation on button press', async () => {
        const { getByText } = renderTradingLocationModalScreen();

        await userEvent.press(getByText('Not now'));

        expect(mockNavigationDispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).toHaveBeenCalledWith({
            type: 'RESET',
            payload: {
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: { screen: 'Home' },
                    },
                ],
            },
        });
    });
});
