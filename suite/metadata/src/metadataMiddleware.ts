import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import { accountsActions, applyDeviceStatesThunk } from '@suite-common/wallet-core';

import * as metadataActions from './metadataActions';
import * as metadataLabelingActions from './metadataLabelingActions';
import { selectMetadataEditing } from './metadataReducer';
import * as metadataThunks from './metadataThunks';
import { selectIsLegacyLabelingVisible } from './selectIsLegacyLabelingVisible';

export const metadataMiddleware = createMiddleware((action, { dispatch, getState, next }) => {
    if (accountsActions.createAccount.match(action)) {
        action.payload = dispatch(metadataLabelingActions.setAccountMetadataKey(action.payload));
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
            if (selectMetadataEditing(getState())) {
                dispatch(metadataActions.setEditing(undefined));
            }
            break;
        default:
        // no default
    }

    return action;
});
