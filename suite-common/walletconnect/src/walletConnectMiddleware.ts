import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { walletConnectActions } from './walletConnectActions';
import * as walletConnectThunks from './walletConnectThunks';

export const prepareWalletConnectMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, extra }) => {
        await next(action);

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
