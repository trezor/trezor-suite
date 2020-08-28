import produce from 'immer';
import { STORAGE, METADATA } from '@suite-actions/constants';
import { Action } from '@suite-types';
import { MetadataState } from '@suite-types/metadata';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
};

export default (state = initialState, action: Action): MetadataState => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.metadata;
            case METADATA.ENABLE:
                draft.enabled = true;
                break;
            case METADATA.DISABLE:
                draft.enabled = false;
                draft.provider = undefined;
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
};
