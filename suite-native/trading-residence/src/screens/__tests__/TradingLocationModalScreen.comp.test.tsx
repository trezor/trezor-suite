import { RouteProp } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import {
    RootStackRoutes,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { renderWithStoreProviderAsync, screen, userEvent } from '@suite-native/test-utils';

import {
    TradingLocationModalScreen,
    TradingLocationModalScreenProps,
} from '../TradingLocationModalScreen';

const mockNavigationDispatch = jest.fn();
const mockRoute: TradingLocationModalScreenProps['route'] = {
    name: RootStackRoutes.TradingLocationModal,
    key: 'TradingLocationModal',
    params: undefined,
};

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
        renderWithStoreProviderAsync(
            <TradingLocationModalScreen
                navigation={
                    {
                        dispatch: mockNavigationDispatch,
                    } as unknown as TradingLocationModalScreenProps['navigation']
                }
                route={mockRoute}
            />,
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components', async () => {
        const { getByText, queryByLabelText } = await renderTradingLocationModalScreen();

        expect(getByText('Trading is now available')).toBeOnTheScreen();
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

    it('should reset navigation on button press', async () => {
        const { getByText } = await renderTradingLocationModalScreen();

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
