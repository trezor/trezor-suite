import { type ActionCreatorWithPayload, type ActionCreatorWithoutPayload } from '@reduxjs/toolkit';

import { type AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type UserContextPayload } from '@suite-common/suite-types';

import { walletConnectActions } from './walletConnectActions';
import * as walletConnectThunks from './walletConnectThunks';

export type WalletConnectMiddlewareDeps = {
    actions: {
        onModalCancel: ActionCreatorWithoutPayload;
        openModal: ActionCreatorWithPayload<UserContextPayload>;
    };
};

type WalletConnectMiddlewareState = void;

export const prepareWalletConnectMiddleware = createMiddlewareWithExtraDeps<
    WalletConnectMiddlewareDeps,
    AnyAction,
    WalletConnectMiddlewareState
>(async (action, { dispatch, next, extra }) => {
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
});
