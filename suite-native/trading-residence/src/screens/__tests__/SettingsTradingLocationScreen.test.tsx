import { type RouteProp } from '@react-navigation/native';
import { combineReducers } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation, localeReducer } from '@suite-native/intl';
import { type SettingsStackParamList, type SettingsStackRoutes } from '@suite-native/navigation';
import {
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';

import { SettingsTradingLocationScreen } from '../SettingsTradingLocationScreen';

const mockNavigationGoBack = jest.fn();
const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

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
        renderWithStoreProvider(<SettingsTradingLocationScreen />, {
            services,
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
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components', () => {
        const { getByText, queryByText, getByLabelText } = renderTradingLocationSettingsScreen();

        expect(
            getByText(getTranslation('tradingResidence.locationSettings.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        ).toBeNull();

        expect(getByLabelText(getTranslation('generic.buttons.goBack'))).toBeOnTheScreen();
    });

    it('should goBack on `Confirm location` press', async () => {
        const { getByText } = renderTradingLocationSettingsScreen();

        await userEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(mockNavigationGoBack).toHaveBeenCalledTimes(1);
    });

    it('should log analytics event on country change', async () => {
        const { getByText } = renderTradingLocationSettingsScreen();

        await userEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
        );
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

        await userEvent.press(getByLabelText(getTranslation('generic.buttons.goBack')));

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
