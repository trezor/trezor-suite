import { isAnyOf } from '@reduxjs/toolkit';

import { type AnyAction, createMiddleware } from '@suite-common/redux-utils';
import { accountsActions, applyDeviceStatesThunk } from '@suite-common/wallet-core';

import { type MetadataAction } from './metadataActions';
import { setAccountMetadataKey } from './metadataLabelingActions/setAccountMetadataKey';
import { setEditing } from './metadataLabelingActions/setEditing';
import { selectLabelingValueBeingEdited } from './metadataReducer';
import * as metadataThunks from './metadataThunks';
import { selectIsLegacyLabelingVisible } from './selectIsLegacyLabelingVisible';

type Action = MetadataAction | ReturnType<typeof accountsActions.createAccount> | AnyAction;

export const metadataMiddleware = createMiddleware<Action>(
    (action, { dispatch, getState, next }) => {
        if (accountsActions.createAccount.match(action)) {
            action.payload = dispatch(setAccountMetadataKey(action.payload));
        }

        if (
            isAnyOf(applyDeviceStatesThunk.fulfilled)(action) &&
            selectIsLegacyLabelingVisible(getState())
        ) {
            const staticSessionId = action.payload.device.state?.staticSessionId;

            if (staticSessionId !== undefined) {
                dispatch(metadataThunks.initNewDeviceStateMetadataThunk(staticSessionId));
            }
        }

        // pass action
        next(action);

        switch (action.type) {
            case '@router/location-change': // hack: to prevent dependency
                // if there is editing field active, changing route turns it inactive
                if (selectLabelingValueBeingEdited(getState())) {
                    dispatch(setEditing(undefined));
                }
                break;
            default:
            // no default
        }

        return action;
    },
);
