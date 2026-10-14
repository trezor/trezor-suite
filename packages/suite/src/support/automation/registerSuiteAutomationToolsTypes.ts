import { type UnknownAction } from 'redux';
import { type ThunkDispatch } from 'redux-thunk';

import { type AutomationToolsState } from '@suite/automation-tools';
import { type GotoThunkDeps, type HistoryDep } from '@suite/router';
import { type DeviceRootState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';

type SuiteAutomationToolsStoreState = AccountsRootState & DeviceRootState & AutomationToolsState;

/**
 * The part of the app store the automation tools use.
 */
export type SuiteAutomationToolsStore = {
    getState: () => SuiteAutomationToolsStoreState;
    dispatch: ThunkDispatch<SuiteAutomationToolsStoreState, GotoThunkDeps, UnknownAction>;
};

export type SuiteAutomationToolsDeps = HistoryDep & {
    store: SuiteAutomationToolsStore;
    /**
     * Handed out by `suite.services`; the tools never call it.
     */
    desktopApi: unknown;
    /**
     * The app's own TrezorConnect (web or Electron); also only handed out.
     */
    connect: unknown;
};
