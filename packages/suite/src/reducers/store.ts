import 'src/support/networksCompositionRoot';

// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
import {
    type DevToolsEnhancerOptions,
    type Dispatch,
    type Middleware,
    type Reducer,
    type ReducersMapObject,
    type UnknownAction,
    combineReducers,
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { type BackupState, backupMiddleware, backupReducer } from '@suite/backup';
import { type RecoveryState, recoveryReducer } from '@suite/recovery';
import { type DesktopSuiteSyncState, prepareSuiteSyncReducer } from '@suite/suite-sync';
import { type FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { type GeolocationState, geolocationReducer } from '@suite-common/geolocation';
import { addLog } from '@suite-common/logger';
import { type ReceiveState, prepareReceiveReducer } from '@suite-common/receive';
import { type SuiteSyncDataState, suiteSyncDataReducer } from '@suite-common/suite-sync';
import { type SuiteSyncQuotaManagerState } from '@suite-common/suite-sync-quota-manager';
import { type ThpState, prepareThpReducer } from '@suite-common/thp';
import {
    type TokenDefinitionsState,
    prepareTokenDefinitionsReducer,
} from '@suite-common/token-definitions';
import { isCodesignBuild } from '@trezor/env-utils';

import { suiteSyncQuotaManagerSlice } from 'src/actions/suiteSyncQuotaManager/suiteSyncQuotaManagerSlice';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import { type GetSuiteMiddlewareDeps, getSuiteMiddleware } from 'src/middlewares/suite';
import { toastMiddleware } from 'src/middlewares/suite/toastMiddleware';
import { type GetWalletMiddlewaresDeps, getWalletMiddlewares } from 'src/middlewares/wallet';
import onboardingReducers from 'src/reducers/onboarding';
import { type OnboardingState } from 'src/reducers/onboarding/onboardingReducer';
import { type SuiteReducersState, suiteReducers } from 'src/reducers/suite';
import { type WalletState, walletReducers } from 'src/reducers/wallet';
import {
    type GlobalSendReceiveFiltersState,
    globalSendReceiveFiltersReducer,
} from 'src/slices/wallet/globalSendReceiveFilters';

import { type BioAuthState, prepareBioAuthReducer } from './bioAuth';
import { type DesktopState, desktopReducer } from './desktop';
import {
    type DesktopBluetoothState,
    prepareDesktopBluetoothReducer,
} from '../actions/bluetooth/desktopBluetoothReducer';
import { extraDependencies } from '../support/extraDependencies';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const bluetoothReducer = prepareDesktopBluetoothReducer(extraDependencies);
const thpReducer = prepareThpReducer(extraDependencies);
const suiteSyncReducer = prepareSuiteSyncReducer(extraDependencies);
const suiteSyncQuotaManagerReducer = suiteSyncQuotaManagerSlice.prepareReducer(extraDependencies);
const receiveReducer = prepareReceiveReducer(extraDependencies);

export type AppState = SuiteReducersState & {
    onboarding: OnboardingState;
    receive: ReceiveState;
    wallet: WalletState;
    recovery: RecoveryState;
    firmware: FirmwareUpdateState;
    backup: BackupState;
    desktop: DesktopState;
    bioAuth: BioAuthState;
    tokenDefinitions: Partial<TokenDefinitionsState>;
    bluetooth: DesktopBluetoothState;
    thp: ThpState;
    suiteSync: DesktopSuiteSyncState;
    suiteSyncQuotaManager: SuiteSyncQuotaManagerState;
    suiteSyncData: SuiteSyncDataState;
    geolocation: GeolocationState;
    globalSendReceiveFilters: GlobalSendReceiveFiltersState;
};

export type SuiteRootReducer = Reducer<AppState, UnknownAction, Partial<AppState>>;

export const rootReducer: SuiteRootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    receive: receiveReducer,
    wallet: walletReducers,
    recovery: recoveryReducer,
    firmware: firmwareReducer,
    backup: backupReducer,
    desktop: desktopReducer,
    bioAuth: prepareBioAuthReducer(extraDependencies),
    tokenDefinitions: tokenDefinitionsReducer,
    bluetooth: bluetoothReducer,
    thp: thpReducer,
    suiteSync: suiteSyncReducer,
    suiteSyncQuotaManager: suiteSyncQuotaManagerReducer,
    suiteSyncData: suiteSyncDataReducer,
    geolocation: geolocationReducer,
    globalSendReceiveFilters: globalSendReceiveFiltersReducer,
} satisfies ReducersMapObject<AppState, never, Record<keyof AppState, never>>);

const loggerExcludedActions = [addLog.type];

type GetCustomMiddlewareDeps = GetSuiteMiddlewareDeps & GetWalletMiddlewaresDeps;

export const getCustomMiddleware = (getExtra: () => GetCustomMiddlewareDeps | null) => {
    const middleware = [
        toastMiddleware,
        ...getSuiteMiddleware(getExtra),
        ...getWalletMiddlewares(getExtra),
        ...onboardingMiddlewares,
        backupMiddleware,
    ];

    if (!isCodesignBuild()) {
        const excludeLogger = (_getState: any, action: any): boolean =>
            // exclude generated lifecycle actions
            // https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions
            !action?.meta?.requestId &&
            // explicitly excluded actions
            !loggerExcludedActions.includes(action.type);

        const logger = createLogger({
            level: 'info',
            predicate: excludeLogger,
            collapsed: true,
        });
        middleware.push(logger);
    }

    return middleware as Middleware<Dispatch, AppState>[];
};

export const devTools: DevToolsEnhancerOptions | false =
    typeof window === 'object' &&
    '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__' in window &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? {
              actionsDenylist: loggerExcludedActions,
          }
        : false;
