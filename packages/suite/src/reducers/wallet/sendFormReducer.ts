import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import { isEmpty } from 'validator';

import { isAddressValid } from '@wallet-utils/validation';

export interface State {
    address: string;
    isAdditionalFormVisible: boolean;
    touched: boolean;
    errors: string[];
}

export const initialState: State = {
    address: '',
    isAdditionalFormVisible: false,
    touched: false,
    errors: [],
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
                draft.address = address;
                if (isEmpty(address) === '') {
                    draft.errors.push('address-not-set');
                    return draft;
                }
                if (!isAddressValid(action.address, networkType)) {
                    draft.errors.push('address-not-valid');
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
