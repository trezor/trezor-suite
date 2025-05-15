import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { accountsActions, deviceActions } from '@suite-common/wallet-core';

import { walletConnectActions } from './walletConnectActions';
import * as walletConnectThunks from './walletConnectThunks';

export const prepareWalletConnectMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, extra }) => {
        await next(action);

        if (accountsActions.updateSelectedAccount.match(action) && action.payload.account) {
            dispatch(
                walletConnectThunks.switchSelectedAccountThunk({
                    account: action.payload.account,
                }),
            );
        }

        if (
            deviceActions.selectDevice.match(action) ||
            accountsActions.createAccount.match(action) ||
            accountsActions.removeAccount.match(action)
        ) {
            dispatch(walletConnectThunks.updateAccountsThunk());
        }

        if (walletConnectActions.createSessionProposal.match(action)) {
            dispatch(
                extra.actions.openModal({
                    type: 'walletconnect-proposal',
                    eventId: action.payload.eventId,
                }),
            );
        }
        if (walletConnectActions.clearSessionProposal.match(action)) {
            dispatch(extra.actions.onModalCancel());
        }

        // TODO: remove after feature is out of experimental
        if (
            action.type === '@suite/set-experimental-features' &&
            Array.isArray(action.payload.enabledFeatures) &&
            action.payload.enabledFeatures.includes('walletconnect')
        ) {
            dispatch(walletConnectThunks.walletConnectInitThunk());
        }

        return action;
    },
);
