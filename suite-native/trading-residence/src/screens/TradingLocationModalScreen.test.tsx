import { type RouteProp } from '@react-navigation/native';
import { combineReducers } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation, localeReducer } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import {
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';

import {
    TradingLocationModalScreen,
    type TradingLocationModalScreenProps,
} from './TradingLocationModalScreen';

const mockNavigationDispatch = jest.fn();
const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

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
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingHistory>,
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
    }),
}));

describe('TradingLocationModalScreen', () => {
    const renderTradingLocationModalScreen = async () =>
        await renderWithStoreProvider(
            <TradingLocationModalScreen
                navigation={
                    {
                        dispatch: mockNavigationDispatch,
                    } as unknown as TradingLocationModalScreenProps['navigation']
                }
                route={mockRoute}
            />,
            {
                store: createLightStore({
                    reducer: {
                        locale: localeReducer,
                        messageSystem: createStaticReducer(messageSystemInitialState),
                        wallet: combineReducers({
                            settings: createStaticReducer(initialWalletSettingsState),
                            trading: combineReducers({
                                residence: residenceReducer,
                            }),
                        }),
                    },
                }),
                services,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render all components', async () => {
        const { getByText, queryByLabelText } = await renderTradingLocationModalScreen();

        expect(
            getByText(getTranslation('tradingResidence.locationSettings.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        ).toBeOnTheScreen();

        expect(queryByLabelText(getTranslation('generic.buttons.goBack'))).toBeNull();
    });

    it('should log analytics event on country change', async () => {
        const { getByText } = await renderTradingLocationModalScreen();

        await userEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
        );
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
        const { getByText } = await renderTradingLocationModalScreen();

        await userEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        );

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
