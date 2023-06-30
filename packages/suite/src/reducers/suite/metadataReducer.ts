import produce from 'immer';

import { STORAGE, METADATA } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import { MetadataState } from 'src/types/suite/metadata';
import { selectDevice, SuiteRootState } from 'src/reducers/suite/suiteReducer';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
};

type MetadataRootState = {
    metadata: MetadataState;
} & SuiteRootState;

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

// is everything ready (more or less) to add label?
export const selectIsLabelingAvailable = (state: MetadataRootState) => {
    const { enabled, provider } = state.metadata;
    const device = selectDevice(state);

    return !!(enabled && device?.metadata?.status === 'enabled' && provider);
};

export default metadataReducer;
