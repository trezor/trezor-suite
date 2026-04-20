import { type StateFromReducersMapObject, combineReducers } from '@reduxjs/toolkit';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { tradingInitialState } from '@suite-native/trading-consts';
import type { TradingState } from '@suite-native/trading-types';

import { TradingEnvironmentWarning } from '../TradingEnvironmentWarning';

describe('TradingEnvironmentWarning', () => {
    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: createStaticReducer(tradingInitialState),
        }),
    } as const;

    const renderTradingEnvironmentWarning = (
        tradingEnvironment: TradingState['tradingEnvironment'],
    ) =>
        renderWithStoreProvider(<TradingEnvironmentWarning />, {
            store: createLightStore({
                reducer,
                preloadedState: {
                    wallet: {
                        trading: {
                            ...tradingInitialState,
                            tradingEnvironment,
                        },
                    },
                } satisfies PreloadedStatePartial<StateFromReducersMapObject<typeof reducer>>,
            }),
        });

    it('should render nothing when tradingEnvironment is [production]', () => {
        const { toJSON } = renderTradingEnvironmentWarning('production');

        expect(toJSON()).toBeNull();
    });

    it.each<TradingState['tradingEnvironment']>(['staging', 'dev', 'localhost'])(
        'should render warning for tradingEnvironment [%s]',
        tradingEnvironment => {
            const { getByText } = renderTradingEnvironmentWarning(tradingEnvironment);

            expect(getByText(`Trading environment: ${tradingEnvironment}`)).toBeOnTheScreen();
        },
    );
});
