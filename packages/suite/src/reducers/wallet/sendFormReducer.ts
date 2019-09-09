import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';

export interface State {
    isAdditionFormVisible: boolean;
}

export const initialState: State = {
    isAdditionFormVisible: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case SETTINGS.SET_ADDITIONAL_FORM_VISIBILITY:
                draft.isAdditionFormVisible = action.isAdditionFormVisible;
                break;
            // no default
        }
    });
};
