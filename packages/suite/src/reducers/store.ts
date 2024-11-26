// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
/// <reference types="redux-thunk/extend-redux" />
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import { addLog } from '@suite-common/logger';
import { isCodesignBuild } from '@trezor/env-utils';
import { mergeDeepObject } from '@trezor/utils';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { prepareFirmwareReducer } from '@suite-common/firmware';

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

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    recovery: recoveryReducers,
    firmware: firmwareReducer,
    backup: backupReducers,
    desktop: desktopReducer,
    tokenDefinitions: tokenDefinitionsReducer,
});

export type AppState = ReturnType<typeof rootReducer>;

const middleware = [
    thunkMiddleware.withExtraArgument(extraDependencies),
    toastMiddleware,
    ...suiteMiddlewares,
    ...walletMiddlewares,
    ...onboardingMiddlewares,
    ...backupMiddlewares,
    ...recoveryMiddlewares,
];

const excludedActions = [addLog.type];

if (!isCodesignBuild()) {
    const excludeLogger = (_getState: any, action: any): boolean =>
        // exclude generated lifecycle actions
        // https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions
        !action?.meta?.requestId &&
        // explicitly excluded actions
        !excludedActions.some(act => action.type === act);

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });
    middleware.push(logger);
}

const devTools =
    typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? {
              actionsBlacklist: excludedActions,
          }
        : false;

const patchConfirm = (statePatch: any) =>
    !isCodesignBuild() ||
    confirm(
        `Trezor Suite is starting with partially predefined state. Press OK only if you intended to do that!\n\n` +
            JSON.stringify(statePatch, null, 4),
    );

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
            ? mergeDeepObject.withOptions({ dotNotation: true }, preloadedState, statePatch)
            : preloadedState;

    return configureStore({
        reducer: rootReducer,
        preloadedState: patchedState,
        middleware,
        devTools,
    });
};
