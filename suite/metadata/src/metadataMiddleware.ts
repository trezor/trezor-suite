import { type Dispatch } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { type AnyAction } from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';

import { type MetadataAction } from './metadataActions';
import * as metadataLabelingActions from './metadataLabelingActions';
import { type MetadataRootState } from './metadataReducer';

type Action = MetadataAction | ReturnType<typeof accountsActions.createAccount> | AnyAction;

export const metadataMiddleware =
    (api: MiddlewareAPI<Dispatch, MetadataRootState>) =>
    (next: Dispatch) =>
    (action: Action): AnyAction => {
        if (accountsActions.createAccount.match(action)) {
            action.payload = api.dispatch(
                metadataLabelingActions.setAccountMetadataKey(action.payload),
            );
        }

        // pass action
        next(action);

        switch (action.type) {
            case '@router/location-change': // hack: to prevent dependency
                // if there is editing field active, changing route turns it inactive
                if (api.getState().metadata.editing) {
                    api.dispatch(metadataLabelingActions.setEditing(undefined));
                }
                break;
            default:
            // no default
        }

        return action;
    };
