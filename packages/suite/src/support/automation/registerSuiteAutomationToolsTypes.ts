import { type UnknownAction } from 'redux';
import { type ThunkDispatch } from 'redux-thunk';

import { type AutomationToolsState } from '@suite/automation-tools';
import { type GotoThunkDeps, type HistoryDep } from '@suite/router';
import { type DeviceRootState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';

type SuiteAutomationToolsStoreState = AccountsRootState & DeviceRootState & AutomationToolsState;

/** The part of the app store the automation tools read and dispatch through. */
export type SuiteAutomationToolsStore = {
    getState: () => SuiteAutomationToolsStoreState;
    dispatch: ThunkDispatch<SuiteAutomationToolsStoreState, GotoThunkDeps, UnknownAction>;
};

export type SuiteAutomationToolsDeps = HistoryDep & {
    store: SuiteAutomationToolsStore;
    /** Live objects `suite.services` hands out; the automation tools never call them. */
    desktopApi: unknown;
    /** The TrezorConnect the app calls: @trezor/connect on web, @trezor/connect-electron on desktop. */
    connect: unknown;
};
