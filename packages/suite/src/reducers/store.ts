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

import { prepareFirmwareReducer } from '@suite-common/firmware';
import { addLog } from '@suite-common/logger';
import { prepareThpReducer } from '@suite-common/thp';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { accountsActions } from '@suite-common/wallet-core';
import { isCodesignBuild } from '@trezor/env-utils';
import { mergeDeepObject } from '@trezor/utils';
import { suiteSyncSlice } from 'src/actions/suiteSync/suiteSyncSlice';

import backupMiddlewares from 'src/middlewares/backup';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import recoveryMiddlewares from 'src/middlewares/recovery';
import { suiteMiddlewares } from 'src/middlewares/suite';
import walletMiddlewares from 'src/middlewares/wallet';
import backupReducers from 'src/reducers/backup';
import onboardingReducers from 'src/reducers/onboarding';
import recoveryReducers from 'src/reducers/recovery';
import suiteReducers from 'src/reducers/suite';
import walletReducers from 'src/reducers/wallet';
// toastMiddleware can be used only in suite-desktop and suite-web
// it's not included into `@suite-middlewares` index
import { geolocationReducer } from '@suite-common/geolocation';
import { ExtraDependencies } from '@suite-common/redux-utils';
import { prepareLabelingReducer } from '@suite-common/suite-sync';
import { OPEN_USER_CONTEXT } from 'src/actions/suite/constants/modalConstants';
import toastMiddleware from 'src/middlewares/suite/toastMiddleware';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';
import { bluetoothSlice } from '../actions/bluetooth/desktopBluetoothReducer';
import { extraDependencies } from '../support/extraDependencies';
import { prepareBioAuthReducer } from './bioAuth';
import { desktopReducer } from './desktop';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const bluetoothReducer = bluetoothSlice.prepareReducer(extraDependencies);
const thpReducer = prepareThpReducer(extraDependencies);
const labelingReducer = prepareLabelingReducer(extraDependencies);
const suiteSyncReducer = suiteSyncSlice.prepareReducer(extraDependencies);

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    recovery: recoveryReducers,
    firmware: firmwareReducer,
    backup: backupReducers,
    desktop: desktopReducer,
    bioAuth: prepareBioAuthReducer(extraDependencies),
    tokenDefinitions: tokenDefinitionsReducer,
    bluetooth: bluetoothReducer,
    thp: thpReducer,
    labeling: labelingReducer,
    suiteSync: suiteSyncReducer,
    geolocation: geolocationReducer,
    globalSendReceiveFilters: globalSendReceiveFilters.reducer,
});

export type AppState = ReturnType<typeof rootReducer>;

const loggerExcludedActions = [addLog.type, accountsActions.updateAccountRefreshTimestamp.type];

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

export const initStore = <E extends Partial<ExtraDependencies>>(
    preloadStoreAction?: PreloadStoreAction,
    options: { statePatch?: Record<string, any>; additionalExtraDeps?: E } = {},
) => {
    // get initial state by calling STORAGE.LOAD action with optional payload
    // payload will be processed in each reducer explicitly
    const preloadedState = preloadStoreAction
        ? rootReducer(undefined, preloadStoreAction)
        : undefined;

    const patchedState =
        preloadedState && options.statePatch && patchConfirm(options.statePatch)
            ? mergeDeepObject.withOptions(
                  { dotNotation: true },
                  preloadedState,
                  options.statePatch as Partial<AppState>,
              )
            : preloadedState;

    return configureStore({
        reducer: rootReducer as Reducer<AppState, InferredAction, PreloadedState>,
        preloadedState: patchedState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                immutableCheck: false,
                serializableCheck: {
                    ignoredActions: [OPEN_USER_CONTEXT],
                    ignoredPaths: [
                        'modal.payload.decision.promise',
                        'modal.payload.decision.resolve',
                        'modal.payload.decision.reject',
                    ],
                },
                thunk: {
                    extraArgument: {
                        ...extraDependencies,
                        ...(options.additionalExtraDeps ?? {}),
                    },
                },
            }).concat(getCustomMiddleware()),
        devTools,
    } as const);
};
