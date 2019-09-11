import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import validator from 'validator';

import { isAddressValid } from '@wallet-utils/validation';

export interface State {
    address: null | string;
    amount: null | string;
    fiatValue: null | string;
    localCurrency: { value: string; label: string };
    isAdditionalFormVisible: boolean;
    errors: {
        address: null | 'empty' | 'not-valid';
        amount: null | 'empty' | 'is-not-number';
    };
}

export const initialState: State = {
    address: null,
    amount: null,
    fiatValue: null,
    localCurrency: { value: 'usd', label: 'USD' },
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
                const { amount } = action;
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

            // Change select "Currency"
            case SEND.HANDLE_SELECT_CURRENCY_CHANGE: {
                const { localCurrency } = action;
                draft.localCurrency = localCurrency;
                break;
            }

            // Change input "Fiat"
            case SEND.HANDLE_FIAT_VALUE_CHANGE: {
                const { fiatValue } = action;
                draft.fiatValue = fiatValue;
                break;
            }

            case SEND.CLEAR: {
                return initialState;
            }

            // no default
        }
    });
};
