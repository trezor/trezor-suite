/* eslint-disable import/order */
// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
import {
    DevToolsEnhancerOptions,
    Dispatch,
    Middleware,
    Reducer,
    combineReducers,
    configureStore,
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { addLog } from '@suite-common/logger';
import { isCodesignBuild } from '@trezor/env-utils';
import { mergeDeepObject } from '@trezor/utils';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { prepareBluetoothReducerCreator } from '@suite-common/bluetooth';
import { accountsActions } from '@suite-common/wallet-core';

import suiteMiddlewares from 'src/middlewares/suite';
import walletMiddlewares from 'src/middlewares/wallet';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import backupMiddlewares from 'src/middlewares/backup';
import recoveryMiddlewares from 'src/middlewares/recovery';
import suiteReducers from 'src/reducers/suite';
import walletReducers from 'src/reducers/wallet';
import onboardingReducers from 'src/reducers/onboarding';
import recoveryReducers from 'src/reducers/recovery';
import backupReducers from 'src/reducers/backup';
// toastMiddleware can be used only in suite-desktop and suite-web
// it's not included into `@suite-middlewares` index
import toastMiddleware from 'src/middlewares/suite/toastMiddleware';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';

import { desktopReducer } from './desktop';
import { extraDependencies } from '../support/extraDependencies';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const bluetoothReducer = prepareBluetoothReducerCreator<BluetoothDevice>()(extraDependencies);

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    recovery: recoveryReducers,
    firmware: firmwareReducer,
    backup: backupReducers,
    desktop: desktopReducer,
    tokenDefinitions: tokenDefinitionsReducer,
    bluetooth: bluetoothReducer,
});

export type AppState = ReturnType<typeof rootReducer>;

const loggerExcludedActions = [addLog.type, accountsActions.updateAccount.type];

const getCustomMiddleware = () => {
    const middleware = [
        toastMiddleware,
        ...suiteMiddlewares,
        ...walletMiddlewares,
        ...onboardingMiddlewares,
        ...backupMiddlewares,
        ...recoveryMiddlewares,
    ];

    if (!isCodesignBuild()) {
        const excludeLogger = (_getState: any, action: any): boolean =>
            // exclude generated lifecycle actions
            // https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions
            !action?.meta?.requestId &&
            // explicitly excluded actions
            !loggerExcludedActions.some(act => action.type === act);

        const logger = createLogger({
            level: 'info',
            predicate: excludeLogger,
            collapsed: true,
        });
        middleware.push(logger);
    }

    return middleware as Middleware<Dispatch, AppState>[];
};

const devTools: DevToolsEnhancerOptions | false =
    typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? {
              actionsDenylist: loggerExcludedActions,
          }
        : false;

const patchConfirm = (statePatch: any) =>
    !isCodesignBuild() ||
    confirm(
        `Trezor Suite is starting with partially predefined state. Press OK only if you intended to do that!\n\n` +
            JSON.stringify(statePatch, null, 4),
    );

type RootReducerShape = typeof rootReducer;
type PreloadedState = Partial<AppState>;
type InferredAction = Parameters<RootReducerShape>[1];

export const initStore = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    // get initial state by calling STORAGE.LOAD action with optional payload
    // payload will be processed in each reducer explicitly
    const preloadedState = preloadStoreAction
        ? rootReducer(undefined, preloadStoreAction)
        : undefined;

    const patchedState =
        preloadedState && statePatch && patchConfirm(statePatch)
            ? mergeDeepObject.withOptions(
                  { dotNotation: true },
                  preloadedState,
                  statePatch as Partial<AppState>,
              )
            : preloadedState;

    return configureStore({
        reducer: rootReducer as Reducer<AppState, InferredAction, PreloadedState>,
        preloadedState: patchedState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: { extraArgument: extraDependencies },
            }).concat(getCustomMiddleware()),
        devTools,
    } as const);
};
