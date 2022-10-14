import type { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as coinjoinAccountActions from '@wallet-actions/coinjoinAccountActions';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
import type { AppState, Action, Dispatch } from '@suite-types';
import { blockchainActions, accountsActions } from '@suite-common/wallet-core';

export const coinjoinMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // cancel discovery for each CoinjoinBackend
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== 'wallet') {
            CoinjoinBackendService.getInstances().forEach(b => b.cancel());
        }

        // propagate action to reducers
        next(action);

        if (action.type === SUITE.READY) {
            api.dispatch(coinjoinAccountActions.restoreCoinjoin());
        }

        if (accountsActions.removeAccount.match(action)) {
            api.dispatch(coinjoinAccountActions.forgetCoinjoinAccounts(action.payload));
        }

        if (action.type === DISCOVERY.START) {
            // find all coinjoin accounts
            const coinjoinAccounts = api
                .getState()
                .wallet.accounts.filter(a => a.accountType === 'coinjoin');
            if (coinjoinAccounts.length > 0) {
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        if (blockchainActions.synced.match(action)) {
            // find all coinjoin accounts for network
            const coinjoinAccounts = api
                .getState()
                .wallet.accounts.filter(
                    a => a.accountType === 'coinjoin' && a.symbol === action.payload.symbol,
                );
            if (coinjoinAccounts.length > 0) {
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        return action;
    };
