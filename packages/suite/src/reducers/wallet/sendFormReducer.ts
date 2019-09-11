import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import validator from 'validator';

import { isAddressValid } from '@wallet-utils/validation';

export interface State {
    address: null | string;
    amount: null | string;
    isAdditionalFormVisible: boolean;
    errors: {
        address: null | 'empty' | 'not-valid';
        amount: null | 'empty' | 'is-not-number';
    };
}

export const initialState: State = {
    address: null,
    amount: null,
    isAdditionalFormVisible: false,
    errors: {
        address: null,
        amount: null,
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

            // Change input "Amount"
            case SEND.HANDLE_AMOUNT_CHANGE: {
                const { amount, networkType } = action;
                console.log('networkType', networkType);
                draft.errors.amount = null;
                draft.amount = amount;

                if (validator.isEmpty(amount)) {
                    draft.errors.amount = 'empty';
                    return draft;
                }
                if (!validator.isNumeric(amount)) {
                    draft.errors.amount = 'is-not-number';
                    return draft;
                }

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
