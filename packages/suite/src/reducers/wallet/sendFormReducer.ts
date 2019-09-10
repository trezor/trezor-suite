import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';

export interface State {
    isAdditionalFormVisible: string[];
}

export const initialState: State = {
    isAdditionalFormVisible: [],
};

const removeFromArray = (array: string[], value: string) => {
    const index = array.indexOf(value);
    if (index !== -1) array.splice(index, 1);
    return array;
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case SEND.SET_ADDITIONAL_FORM_VISIBILITY: {
                const { id } = action;
                if (!state.isAdditionalFormVisible.includes(id)) {
                    draft.isAdditionalFormVisible.push(id);
                } else {
                    draft.isAdditionalFormVisible = removeFromArray(
                        draft.isAdditionalFormVisible,
                        id,
                    );
                }
                break;
            }

            // no default
        }
    });
};
