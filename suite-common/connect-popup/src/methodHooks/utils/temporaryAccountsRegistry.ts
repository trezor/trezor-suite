import { type Dispatch } from '@reduxjs/toolkit/react';

import { accountsActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

export type TemporaryAccountsRegistry = {
    /** Remember a placeholder account created in preCallHook so it can be torn down later. */
    track: (account: Account) => void;
    /** Drain the tracked placeholders via a single removeAccount dispatch (no-op if empty). */
    cleanup: (dispatch: Dispatch) => void;
};

// Every drain registered by a sign hook, so cleanupAllTemporaryAccounts can tear all of them down
// without a hand-maintained list — a new coin cannot forget to wire itself into the safety net.
const registeredCleanups: Array<(dispatch: Dispatch) => void> = [];

// A sign hook creates a placeholder account in preCallHook that is normally torn down in
// postCallHook. If the call throws between the two (e.g. Device_Disconnected), postCallHook never
// runs and the placeholder leaks, later causing a stale removeAccount payload. Each hook owns one
// registry; the thunk's finally calls cleanupAllTemporaryAccounts so the leak cannot survive a call
// regardless of how it ends.
export const createTemporaryAccountsRegistry = (): TemporaryAccountsRegistry => {
    const temporaryAccounts: Account[] = [];

    const cleanup = (dispatch: Dispatch) => {
        if (temporaryAccounts.length) {
            // Dispatch a copy: temporaryAccounts is cleared below and Redux carries the payload by
            // reference, so mutating it would mutate the already-dispatched action's payload.
            dispatch(accountsActions.removeAccount([...temporaryAccounts]));
            temporaryAccounts.length = 0;
        }
    };

    registeredCleanups.push(cleanup);

    return {
        track: account => {
            temporaryAccounts.push(account);
        },
        cleanup,
    };
};

export const cleanupAllTemporaryAccounts = (dispatch: Dispatch) => {
    registeredCleanups.forEach(cleanup => cleanup(dispatch));
};
