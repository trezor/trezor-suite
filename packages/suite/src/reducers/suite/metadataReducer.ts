import produce from 'immer';
import { STORAGE, METADATA } from '@suite-actions/constants';
import { Action } from '@suite-types';
import { MetadataState } from '@suite-types/metadata';

export const initialState: MetadataState = {
    enabled: true,
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
                break;
            case METADATA.SET_PROVIDER:
                draft.provider = action.payload;
                break;

            // no default
        }
    });
};
