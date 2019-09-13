import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import validator from 'validator';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

import { isAddressValid } from '@wallet-utils/validation';

export interface State {
    address: null | string;
    amount: null | string;
    fiatValue: null | string;
    localCurrency: { value: string; label: string };
    isAdditionalFormVisible: boolean;
    errors: {
        address: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_VALID;
        amount:
            | null
            | typeof VALIDATION_ERRORS.IS_EMPTY
            | typeof VALIDATION_ERRORS.NOT_NUMBER
            | typeof VALIDATION_ERRORS.NOT_ENOUGH;
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
                    draft.errors.address = 'is-empty';
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
                const { amount, availableBalance } = action;
                draft.errors.amount = null;
                draft.amount = amount;

                if (validator.isEmpty(amount)) {
                    draft.errors.amount = 'is-empty';
                    return draft;
                }

                if (!validator.isNumeric(amount)) {
                    draft.errors.amount = 'not-number';
                    return draft;
                }

                if (availableBalance < amount || availableBalance === '0') {
                    draft.errors.amount = 'not-enough';
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

            // Change input "SetMax"
            case SEND.SET_MAX_AMOUNT: {
                return state;
            }

            case SEND.CLEAR: {
                return initialState;
            }

            // no default
        }
    });
};
