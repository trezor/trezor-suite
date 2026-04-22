import { combineReducers } from '@reduxjs/toolkit';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';

import {
    TradingLocationSettings,
    type TradingLocationSettingsProps,
} from '../TradingLocationSettings';

describe('TradingLocationSettings', () => {
    let store: TestStore;

    const renderTradingLocationSettings = (props: TradingLocationSettingsProps) =>
        renderWithStoreProvider(<TradingLocationSettings {...props} />, { store });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: combineReducers({
                        residence: residenceReducer,
                    }),
                }),
            },
        });
    });

    afterEach(() => {
        // make sure component is unmounted (FlashList otherwise might try to do some magic)
        screen.unmount();
    });

    it('should render all components', () => {
        const { getByText } = renderTradingLocationSettings({
            context: 'settings',
            children: <Text>Test Children</Text>,
        });

        expect(getByText('Test Children')).toBeOnTheScreen();
        expect(getByText('Trading is available')).toBeOnTheScreen();
        expect(getByText('Country of residence')).toBeOnTheScreen();
        expect(getByText('🇵🇱 POL')).toBeOnTheScreen();
    });
});
