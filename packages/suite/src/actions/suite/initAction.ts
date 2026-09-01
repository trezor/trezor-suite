import { type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type FlagsRootState, selectFlags, setFlag } from '@suite/flags';
import { type MetadataRootState, metadataLabelingActions } from '@suite/metadata';
import {
    type GotoThunkDeps,
    type GotoThunkState,
    initialRedirection,
    routerInit,
} from '@suite/router';
import {
    type SuiteSettingsRootState,
    selectEarnYieldWorkerBaseUrl,
    selectLanguage,
    suiteSettingsActions,
} from '@suite/settings';
import { onSuiteInit, onSuiteReady } from '@suite/suite-lifecycle';
import * as trezorConnectActions from '@suite-common/connect-init';
import { type ConnectInitThunkDeps, type ConnectInitThunkState } from '@suite-common/connect-init';
import { type DeviceRootState } from '@suite-common/device';
import { earnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-api';
import {
    type MessageSystemRootState,
    initMessageSystemThunk,
    prepareCachedEnvData,
    selectActiveKillswitchMessage,
} from '@suite-common/message-system';
import {
    type InitTokenDefinitionsThunkDeps,
    type InitTokenDefinitionsThunkState,
    periodicCheckTokenDefinitionsThunk,
} from '@suite-common/token-definitions';
import {
    type InitBlockchainThunkDeps,
    type InitBlockchainThunkState,
    type InitStakeDataThunkState,
    type PeriodicFetchFiatRatesThunkDeps,
    type PeriodicFetchFiatRatesThunkState,
    type UpdateMissingTxFiatRatesThunkState,
    type WalletSettingsRootState,
    initBlockchainThunk,
    initDevices,
    periodicCheckStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectBaseCurrency,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
    type WalletConnectInitThunkDeps,
    type WalletConnectInitThunkState,
} from '@suite-common/walletconnect';
import * as walletConnectActions from '@suite-common/walletconnect';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import * as bioAuthThunks from 'src/actions/suite/bioAuthThunks';
import { type SuiteRootState } from 'src/reducers/suite/suiteReducer';
import { selectSuiteLifecycleStatus } from 'src/selectors/suite/suiteSelectors';

import { setSuiteError } from './suiteActions';

type InitThunkState = ConnectInitThunkState &
    DeviceRootState &
    FlagsRootState &
    GotoThunkState &
    InitBlockchainThunkState &
    InitStakeDataThunkState &
    InitTokenDefinitionsThunkState &
    MessageSystemRootState &
    MetadataRootState &
    PeriodicFetchFiatRatesThunkState &
    SuiteRootState &
    SuiteSettingsRootState &
    UpdateMissingTxFiatRatesThunkState &
    WalletConnectInitThunkState &
    WalletSettingsRootState;

type InitThunkDeps = ConnectInitThunkDeps &
    GotoThunkDeps &
    InitBlockchainThunkDeps &
    InitTokenDefinitionsThunkDeps &
    PeriodicFetchFiatRatesThunkDeps &
    WalletConnectInitThunkDeps;

export const init =
    () =>
    async (
        dispatch: ThunkDispatch<InitThunkState, InitThunkDeps, UnknownAction>,
        getState: () => InitThunkState,
    ) => {
        const status = selectSuiteLifecycleStatus(getState());
        const language = selectLanguage(getState());
        const localCurrency = selectBaseCurrency(getState());
        const { enableAutoupdateOnNextRun } = selectFlags(getState());

        if (status !== 'initial') return;

        dispatch(onSuiteInit());

        // apply the earn yield worker base url from debug settings (or the default for this build)
        earnYieldWorkerBaseUrl.set(selectEarnYieldWorkerBaseUrl(getState()));

        await dispatch(initDevices());

        /**
         * ----------------------------------------------
         * Right after storage is loaded, we might start:
         * ----------------------------------------------
         *
         * Todo: This is good place to be refactored into separate functions.
         *       Those number-comments are very strong indicator that this code
         *       has many responsibilities and should be split into smaller parts.
         */

        // 2. fetching locales
        dispatch(suiteSettingsActions.setLanguage(language));

        // 3. fetch message system config
        await prepareCachedEnvData();
        await dispatch(initMessageSystemThunk());

        // 4. turn on auto updates if needed
        if (isDesktop() && enableAutoupdateOnNextRun) {
            dispatch(setFlag({ key: 'enableAutoupdateOnNextRun', value: false }));
            desktopApi.setAutomaticUpdateEnabled(true);
        }

        // 5. redirecting user into welcome screen (if needed)
        dispatch(initialRedirection({ isInitialRun: selectFlags(getState()).initialRun }));

        // Do not initialize Connect or anything else related to it, if there is an app-wide killswitch via message-system.
        const activeKillswitchMessage = selectActiveKillswitchMessage(getState());
        if (activeKillswitchMessage) return;

        // 6. init connect (could throw an error, then the error is caught in <ErrorBoundary /> in Main.tsx.
        try {
            // it is necessary to unwrap the result here because init calls async thunk from redux-toolkit which is always resolved
            // see more details here: https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
            await dispatch(trezorConnectActions.connectInitThunk()).unwrap();
        } catch (err) {
            dispatch(setSuiteError(err.message));

            return;
        }

        // 7. init backends
        await dispatch(initBlockchainThunk())
            .unwrap()
            .catch(err => console.error(err));

        // 8. fetch token definitions (has to be fetched before fiat rates)
        await dispatch(periodicCheckTokenDefinitionsThunk());

        // 9. init periodic fetching of fiat rates
        await dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'current',
                localCurrency,
            }),
        );
        await dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'lastWeek',
                localCurrency,
            }),
        );

        // 10. fetch rates for transactions with missing rates
        await dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));

        // 11. dispatch initial location change
        dispatch(routerInit());

        // 12. fetch metadata. metadata is not saved together with other data in storage.
        // historically it was saved in indexedDB together with devices and accounts and we did not need to load them
        // immediately after suite start.
        dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices());

        // 13. start fetching staking data if needed, does need to be waited
        dispatch(periodicCheckStakeDataThunk());

        // 14. init wallet connect
        dispatch(walletConnectActions.walletConnectInitThunk());
        // 15. bio auth
        if (isDesktop()) {
            dispatch(bioAuthThunks.init());
        }
        // 16. backend connected, suite is ready to use
        dispatch(onSuiteReady());
    };
