import { Text } from 'react-native';

import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { NetworkAndAccountCard, type NetworkAndAccountCardProps } from '../NetworkAndAccountCard';

describe('NetworkAndAccountCard', () => {
    const reducer = {
        locale: localeReducer,
        device: createStaticReducer(deviceInitialState),
        messageSystem: createStaticReducer(messageSystemInitialState),
        suiteSync: createStaticReducer(initialSuiteSyncState),
        suiteSyncData: createStaticReducer(initialSuiteSyncDataState),
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer([btc1NormalAccount]),
        }),
    } as const;

    const renderNetworkAndAccountCard = (props: Partial<NetworkAndAccountCardProps>) =>
        renderWithStoreProvider(
            <NetworkAndAccountCard title="TITLE" account={btc1NormalAccount} {...props} />,
            {
                store: createLightStore({
                    reducer,
                    preloadedState: {
                        wallet: {
                            accounts: [btc1NormalAccount],
                        },
                    },
                }),
            },
        );

    it('should render title, network name and account label', () => {
        const { getByText, getByHintText } = renderNetworkAndAccountCard({});

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByHintText('Network Icon')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });

    it('should render children', () => {
        const { getByText } = renderNetworkAndAccountCard({
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
