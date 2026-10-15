import { connectInitThunk } from '@suite-common/connect-init';
import {
    defaultEarnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrl,
} from '@suite-common/earn-stablecoin-api';
import {
    type MessageSystemRootState,
    initMessageSystemThunk,
    prepareCachedEnvData,
    selectActiveKillswitchMessage,
} from '@suite-common/message-system';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    type WalletSettingsRootState,
    createImportedDeviceThunk,
    initBlockchainThunk,
    initDevicesThunk,
    initStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectBaseCurrency,
} from '@suite-common/wallet-core';
import { walletConnectInitThunk } from '@suite-common/walletconnect';
import { initAnalyticsThunk } from '@suite-native/analytics-redux';
import {
    type SettingsSliceRootState,
    selectEarnYieldWorkerBaseUrl,
    selectIsOnboardingFinished,
} from '@suite-native/settings';
import { type DispatchDep } from '@trezor/redux-utils';
import { err, ok } from '@trezor/type-utils';

import {
    type ApplicationInitDep,
    type PrepareCachedEnvDataError,
    createApplicationInit,
} from './applicationInitThunk';
import { appInitActions } from './appInitSlice';
import { createConnectAndBlockchainInit } from './connectAndBlockchainInitThunk';
import { type PostOnboardingInitDep, createPostOnboardingInit } from './postOnboardingInitThunk';

export type AppInitCompositionRootState = SettingsSliceRootState &
    MessageSystemRootState &
    WalletSettingsRootState;

export type AppInitCompositionRootDeps = DispatchDep & {
    getState: () => AppInitCompositionRootState;
};

export const createAppInitCompositionRoot = (
    deps: AppInitCompositionRootDeps,
): ApplicationInitDep & PostOnboardingInitDep => {
    const connectAndBlockchainInit = createConnectAndBlockchainInit({
        connectInit: async () => {
            const result = await deps.dispatch(connectInitThunk());

            return connectInitThunk.rejected.match(result) ? err(result.error) : ok();
        },
        initBlockchain: async () => {
            const result = await deps.dispatch(initBlockchainThunk());

            return initBlockchainThunk.rejected.match(result) ? err(result.error) : ok();
        },
        logError: message => console.error(message),
    });
    const postOnboardingInit = createPostOnboardingInit({
        connectAndBlockchainInit,
        getIsKillswitchActive: () => Boolean(selectActiveKillswitchMessage(deps.getState())),
        periodicCheckTokenDefinitions: () => {
            deps.dispatch(periodicCheckTokenDefinitionsThunk());
        },
        initStakeData: () => {
            deps.dispatch(initStakeDataThunk());
        },
        periodicFetchFiatRates: params => {
            deps.dispatch(periodicFetchFiatRatesThunk(params));
        },
        getBaseCurrency: () => selectBaseCurrency(deps.getState()),
        walletConnectInit: () => {
            deps.dispatch(walletConnectInitThunk());
        },
        onPostOnboardingInitStarted: () => {
            deps.dispatch(appInitActions.postOnboardingInitStarted());
        },
        onPostOnboardingInitFinished: status => {
            deps.dispatch(appInitActions.postOnboardingInitFinished(status));
        },
    });
    const applicationInit = createApplicationInit({
        postOnboardingInit,
        prepareCachedEnvData: () =>
            prepareCachedEnvData().then(
                () => ok(),
                (cause: unknown) =>
                    err<PrepareCachedEnvDataError>({ type: 'PrepareCachedEnvDataError', cause }),
            ),
        defaultEarnYieldWorkerBaseUrl,
        getEarnYieldWorkerBaseUrl: () => selectEarnYieldWorkerBaseUrl(deps.getState()),
        setEarnYieldWorkerBaseUrl: url => earnYieldWorkerBaseUrl.set(url),
        initAnalytics: () => {
            deps.dispatch(initAnalyticsThunk());
        },
        initMessageSystem: () => {
            deps.dispatch(initMessageSystemThunk());
        },
        initDevices: async () => {
            await deps.dispatch(initDevicesThunk());
        },
        createImportedDevice: async () => {
            await deps.dispatch(createImportedDeviceThunk());
        },
        getIsOnboardingFinished: () => selectIsOnboardingFinished(deps.getState()),
        onApplicationInitFinished: () => {
            deps.dispatch(appInitActions.applicationInitFinished());
        },
    });

    return { applicationInit, postOnboardingInit };
};
