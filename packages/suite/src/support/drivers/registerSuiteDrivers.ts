import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DriversState, createDrivers, registerToolDiscovery } from '@suite/drivers';
import { type GotoThunkDeps, type HistoryDep } from '@suite/router';
import { type DeviceRootState, selectDeviceThunk } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';

import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

import { createSeedStorage } from './createSeedStorage';

type SuiteDriversStoreState = AccountsRootState & DeviceRootState & DriversState;

/** The part of the app store the drivers read and dispatch through. */
export type SuiteDriversStore = {
    getState: () => SuiteDriversStoreState;
    dispatch: ThunkDispatch<SuiteDriversStoreState, GotoThunkDeps, UnknownAction>;
};

export type SuiteDriversDeps = HistoryDep & {
    store: SuiteDriversStore;
    /** Live objects `suite.services` hands out; the drivers never call them. */
    desktopApi: unknown;
    /** The TrezorConnect the app calls: @trezor/connect on web, @trezor/connect-electron on desktop. */
    connect: unknown;
};

/**
 * Registers the gated `suite` tool group for chrome-devtools-mcp and the perf rig. Returns the
 * function that removes the listener again.
 */
export const registerSuiteDrivers = (deps: SuiteDriversDeps) =>
    registerToolDiscovery(
        createDrivers({
            store: deps.store,
            services: {
                store: deps.store,
                connect: deps.connect,
                desktopApi: deps.desktopApi,
                history: deps.history,
            },
            getStorageDefaults: createEmptyStoragePayload,
            seedStorage: createSeedStorage({
                dispatch: deps.store.dispatch,
                getState: deps.store.getState,
                selectDevice: device => deps.store.dispatch(selectDeviceThunk({ device })),
            }),
            document,
        }),
    );
