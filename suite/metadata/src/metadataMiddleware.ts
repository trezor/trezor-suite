import { Dispatch } from '@reduxjs/toolkit';
import { MiddlewareAPI } from 'redux';

import { AnyAction } from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';

import { MetadataAction } from './metadataActions';
import * as metadataLabelingActions from './metadataLabelingActions';
import { MetadataRootState } from './metadataReducer';

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
