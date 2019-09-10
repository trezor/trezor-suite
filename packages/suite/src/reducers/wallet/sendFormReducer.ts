import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';

export interface State {
    isAdditionalFormVisible: boolean;
}

export const initialState: State = {
    isAdditionalFormVisible: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case SEND.SET_ADDITIONAL_FORM_VISIBILITY: {
                draft.isAdditionalFormVisible = !state.isAdditionalFormVisible;
                break;
            }

            // no default
        }
    });
};
