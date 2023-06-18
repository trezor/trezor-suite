import produce from 'immer';
import { createSelector } from '@reduxjs/toolkit';

import { STORAGE, METADATA } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import { MetadataState } from 'src/types/suite/metadata';
import { selectDevice } from 'src/reducers/suite/suiteReducer';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
};

const metadataReducer = (state = initialState, action: Action): MetadataState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return action.payload.metadata || state;
            case METADATA.ENABLE:
                draft.enabled = true;
                break;
            case METADATA.DISABLE:
                draft.enabled = false;
                break;
            case METADATA.SET_PROVIDER:
                draft.provider = action.payload;
                break;
            case METADATA.SET_EDITING:
                draft.editing = action.payload;
                break;
            case METADATA.SET_INITIATING:
                draft.initiating = action.payload;
                break;
            // no default
        }
    });

const selectMetadata = (state: { metadata: MetadataState }) => state.metadata;

// is everything ready (more or less) to add label?
export const selectIsLabelingAvailable = createSelector(
    [selectDevice, selectMetadata],
    (device, metadata) =>
        !!(metadata.enabled && device?.metadata?.status === 'enabled' && metadata.provider),
);

export default metadataReducer;
