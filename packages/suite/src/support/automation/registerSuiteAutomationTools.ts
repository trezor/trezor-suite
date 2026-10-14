import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import {
    type AutomationToolsState,
    createAutomationTools,
    registerToolDiscovery,
} from '@suite/automation-tools';
import { type GotoThunkDeps, type HistoryDep } from '@suite/router';
import { type DeviceRootState, selectDeviceThunk } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { toGetter } from '@trezor/dependency-injection';

import { type SuiteRootState } from 'src/reducers/suite/suiteReducer';
import { selectSuiteLifecycleStatus } from 'src/selectors/suite/suiteSelectors';
import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

import { createSeedStorage } from './createSeedStorage';

type SuiteAutomationStoreState = SuiteRootState &
    AccountsRootState &
    DeviceRootState &
    AutomationToolsState;

/** The part of the app store the tools read and dispatch through. */
export type SuiteAutomationStore = {
    getState: () => SuiteAutomationStoreState;
    dispatch: ThunkDispatch<SuiteAutomationStoreState, GotoThunkDeps, UnknownAction>;
};

export type SuiteAutomationToolsDeps = HistoryDep & {
    store: SuiteAutomationStore;
    /** Live objects `suite.services` hands out; the tools never call them. */
    desktopApi: unknown;
    /** The TrezorConnect the app calls: @trezor/connect on web, @trezor/connect-electron on desktop. */
    connect: unknown;
};

/**
 * Registers the gated `suite` tool group for chrome-devtools-mcp and the perf rig. Returns the
 * function that removes the listener again.
 */
export const registerSuiteAutomationTools = (deps: SuiteAutomationToolsDeps) =>
    registerToolDiscovery(
        createAutomationTools({
            store: deps.store,
            services: {
                store: deps.store,
                connect: deps.connect,
                desktopApi: deps.desktopApi,
                history: deps.history,
            },
            getLifecycleStatus: toGetter(deps.store.getState, selectSuiteLifecycleStatus),
            getStorageDefaults: createEmptyStoragePayload,
            seedStorage: createSeedStorage({
                dispatch: deps.store.dispatch,
                getState: deps.store.getState,
                selectDevice: device => deps.store.dispatch(selectDeviceThunk({ device })),
            }),
            document,
        }),
    );
