import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import validator from 'validator';

import { isAddressValid } from '@wallet-utils/validation';

export interface State {
    address: string;
    isAdditionalFormVisible: boolean;
    touched: boolean;
    errors: {
        address: string | null;
    };
}

export const initialState: State = {
    address: '',
    isAdditionalFormVisible: false,
    touched: false,
    errors: {
        address: null,
    },
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            // Show additional form
            case SEND.SET_ADDITIONAL_FORM_VISIBILITY: {
                draft.isAdditionalFormVisible = !state.isAdditionalFormVisible;
                break;
            }

            // Change input "Address"
            case SEND.HANDLE_ADDRESS_CHANGE: {
                const { address, networkType } = action;
                draft.errors.address = null;
                draft.address = address;
                if (validator.isEmpty(address)) {
                    draft.errors.address = 'empty';
                    return draft;
                }
                if (!isAddressValid(action.address, networkType)) {
                    draft.errors.address = 'not-valid';
                    return draft;
                }
                break;
            }

            case SEND.TOUCH: {
                draft.touched = true;
                break;
            }

            case SEND.CLEAR: {
                draft.address = '';
                break;
            }

            // no default
        }
    });
};
