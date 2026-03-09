import { metadataLabelingActions } from '@suite/metadata';
import * as modalActions from '@suite/modal';
import { recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import * as trezorConnectActions from '@suite-common/connect-init';
import { initMessageSystemThunk, prepareCachedEnvData } from '@suite-common/message-system';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    initBlockchainThunk,
    initDevices,
    periodicCheckStakeDataThunk,
    periodicFetchFiatRatesThunk,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import * as walletConnectActions from '@suite-common/walletconnect';
import { DEVICE, UI_REQUEST } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bluetoothOnDeviceConnectedThunk } from 'src/actions/bluetooth/bluetoothOnDeviceConnectedThunk';
import * as languageActions from 'src/actions/settings/languageActions';
import * as bioAuthThunks from 'src/actions/suite/bioAuthThunks';
import * as routerActions from 'src/actions/suite/routerActions';
import { markDeviceAsRecentlyConnectedThunk } from 'src/actions/wallet/markDeviceAsRecentlyConnectedThunk';
import type { Dispatch, GetState } from 'src/types/suite';

import { SUITE } from './constants';
import { onSuiteReady, setFlag } from './suiteActions';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const {
        suite: {
            settings: { language },
            lifecycle: { status },
            flags: { enableAutoupdateOnNextRun },
        },
        wallet: {
            settings: { localCurrency },
        },
    } = getState();

    if (status !== 'initial') return;

    dispatch({ type: SUITE.INIT });

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
    dispatch(languageActions.setLanguage(language));

    // 3. fetch message system config
    await prepareCachedEnvData();
    await dispatch(initMessageSystemThunk());

    // 4. turn on auto updates if needed
    if (isDesktop() && enableAutoupdateOnNextRun) {
        dispatch(setFlag('enableAutoupdateOnNextRun', false));
        desktopApi.setAutomaticUpdateEnabled(true);
    }

    // 5. redirecting user into welcome screen (if needed)
    dispatch(routerActions.initialRedirection());

    // 6. init connect (could throw an error,
    // then the error is caught in <ErrorBoundary /> in Main.tsx
    try {
        // it is necessary to unwrap the result here because init calls async thunk from redux-toolkit which is always resolved
        // see more details here: https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
        await dispatch(
            trezorConnectActions.connectInitThunk({
                [DEVICE.CONNECT]: device => {
                    dispatch(markDeviceAsRecentlyConnectedThunk(device));
                    dispatch(bluetoothOnDeviceConnectedThunk(device));
                },
                [DEVICE.CONNECT_UNACQUIRED]: device => {
                    dispatch(markDeviceAsRecentlyConnectedThunk(device));
                },
                [UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED]: () => {
                    dispatch(
                        modalActions.openModal({ type: UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED }),
                    );
                    dispatch(modalActions.preserve());
                },
                [UI_REQUEST.REQUEST_WORD]: () => {
                    if (selectRecoveryStatus(getState()) === 'waiting-for-confirmation') {
                        // Since the device asked for a first word, we can safely assume we've received confirmation from the user
                        dispatch(recoveryActions.setStatus('in-progress'));
                    }
                },
            }),
        ).unwrap();
    } catch (err) {
        dispatch({ type: SUITE.ERROR, error: err.message });

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
    dispatch(routerActions.init());

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
