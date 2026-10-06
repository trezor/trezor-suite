import { type Store, combineReducers } from '@reduxjs/toolkit';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';
import { type TradingResidenceRootState } from '@suite-native/trading-types';

import {
    TradingLocationSettings,
    type TradingLocationSettingsProps,
} from './TradingLocationSettings';

type State = TradingResidenceRootState;

describe('TradingLocationSettings', () => {
    let store: Store<State>;

    const createStore = (preloadedResidenceState = {}) =>
        createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: combineReducers({
                        residence: residenceReducer,
                    }),
                }),
            },
            preloadedState: {
                wallet: {
                    trading: {
                        residence: preloadedResidenceState,
                    },
                },
            },
        });

    const renderTradingLocationSettings = async (props: TradingLocationSettingsProps) =>
        await renderWithStoreProvider(<TradingLocationSettings {...props} />, {
            services: { store },
        });

    beforeEach(() => {
        store = createStore();
    });

    afterEach(async () => {
        // make sure component is unmounted (FlashList otherwise might try to do some magic)
        await screen.unmount();
    });

    it('should render all components', async () => {
        const { getByText } = await renderTradingLocationSettings({
            context: 'settings',
            children: <Text>Test Children</Text>,
        });

        expect(getByText('Test Children')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('tradingResidence.locationSettings.tradingAvailable')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
        ).toBeOnTheScreen();
        expect(getByText('POL')).toBeOnTheScreen();
    });

    it('should show trading as unavailable when required subdivision is missing', async () => {
        store = createStore({
            country: 'US',
            countrySubdivision: undefined,
            wasOnboardingVisited: false,
        });

        const { getByText } = await renderTradingLocationSettings({
            context: 'settings',
            children: <Text>Test Children</Text>,
        });

        expect(
            getByText(getTranslation('tradingResidence.locationSettings.tradingUnavailable')),
        ).toBeOnTheScreen();
    });
});
