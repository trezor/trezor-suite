import { Text } from 'react-native';

import { type StateFromReducersMapObject, combineReducers } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { TradeSideCard, type TradeSideCardProps } from '../TradeSideCard';

describe('TradeSideCard', () => {
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

    const renderTradeSideCard = (props: Partial<TradeSideCardProps>) =>
        renderWithStoreProvider(
            <TradeSideCard
                account={btc1NormalAccount}
                amount={<Text>AMOUNT</Text>}
                title={<Text>TITLE</Text>}
                {...props}
            />,
            {
                store: createLightStore({
                    reducer,
                    preloadedState: {
                        wallet: {
                            accounts: [btc1NormalAccount],
                        },
                    } satisfies PreloadedStatePartial<StateFromReducersMapObject<typeof reducer>>,
                }),
                providers: ['intl'],
            },
        );

    it('should render nothing when no cryptoId is specified', () => {
        const { toJSON } = renderTradeSideCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render title, amount and account label', () => {
        const { getByText } = renderTradeSideCard({ cryptoId: 'bitcoin' as CryptoId });

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('AMOUNT')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });

    it('should render children when provided', () => {
        const { getByText } = renderTradeSideCard({
            cryptoId: 'bitcoin' as CryptoId,
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
