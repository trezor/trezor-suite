import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import { type DesktopSuiteSyncRootState } from '@suite/suite-sync';
import { type NetworksRootState } from '@suite-common/networks';
import { selectSuiteSyncCustomRelayUrl, setSuiteSyncRelayUrl } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { type ReloadAppDep } from '@suite-common/suite-types';
import {
    type BlockchainRootState,
    type WalletSettingsRootState,
    blockchainActions,
} from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { selectResettableCustomBackendSymbols } from 'src/selectors/suite/backendSelectors';
import { type DbDep } from 'src/storage/createDb';

import {
    removeDatabaseThunk,
    saveBackendThunk,
    saveSuiteSyncSettingsThunk,
} from './storageActions';

type ResetSuiteAppThunkState = GotoThunkState;

type ResetSuiteAppThunkDeps = GotoThunkDeps &
    WithServices<ReloadAppDep & DbDep & DesktopApiDep<'available' | 'clearStore' | 'appAutoStart'>>;

export const resetSuiteAppThunk = createThunk<
    void,
    void,
    { state: ResetSuiteAppThunkState; extra: ResetSuiteAppThunkDeps }
>('@suite/reset-app', async (_, { dispatch, extra }) => {
    localStorage.clear();
    dispatch(removeDatabaseThunk());

    if (extra.services.desktopApi.available) {
        // Reset the desktop-specific store.
        extra.services.desktopApi.clearStore();
        extra.services.desktopApi.appAutoStart(false);
    } else {
        // redirect to / and reload the web
        await dispatch(gotoThunk({ routeName: 'suite-index' }));
    }

    extra.services.reloadApp();
});

type ResetCustomServersThunkState = BlockchainRootState &
    NetworksRootState &
    WalletSettingsRootState &
    DesktopSuiteSyncRootState;

type ResetCustomServersThunkParams = {
    // the reload reconnects the relays; reconnecting first could hang on the very relay being reset
    willReload: boolean;
};

type ResetCustomServersThunkDeps = WithServices<SuiteSyncDep & DbDep>;

export const resetCustomServersThunk = createThunk<
    void,
    ResetCustomServersThunkParams,
    { state: ResetCustomServersThunkState; extra: ResetCustomServersThunkDeps }
>('@suite/reset-custom-servers', async ({ willReload }, { dispatch, getState, extra }) => {
    const customBackendSymbols = selectResettableCustomBackendSymbols(getState());

    customBackendSymbols.forEach(symbol => {
        dispatch(blockchainActions.setBackend({ symbol, type: 'default' }));
    });

    // The storage middleware saves these too, but without awaiting, and the error screen reloads right after.
    await Promise.all(customBackendSymbols.map(symbol => dispatch(saveBackendThunk(symbol))));

    if (selectSuiteSyncCustomRelayUrl(getState()) !== null) {
        if (willReload) {
            dispatch(setSuiteSyncRelayUrl({ url: null }));
        } else {
            await extra.services.suiteSync.changeRelayUrl({ relayUrl: null });
        }
        await dispatch(saveSuiteSyncSettingsThunk());
    }
});
