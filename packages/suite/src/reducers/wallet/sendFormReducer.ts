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
    fee: null | string;
    isAdditionalFormVisible: boolean;
    errors: {
        address: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_VALID;
        amount:
            | null
            | typeof VALIDATION_ERRORS.IS_EMPTY
            | typeof VALIDATION_ERRORS.NOT_NUMBER
            | typeof VALIDATION_ERRORS.NOT_ENOUGH;
    };
    xrp: {
        destinationTag: null | string;
    };
    eth: {
        gasLimit: null | string;
        gasPrice: null | string;
        data: null | string;
    };
}

export const initialState: State = {
    address: null,
    amount: null,
    fiatValue: null,
    fee: null,
    localCurrency: { value: 'usd', label: 'USD' },
    isAdditionalFormVisible: false,
    errors: { address: null, amount: null },
    xrp: {
        destinationTag: null,
    },
    eth: {
        gasPrice: null,
        gasLimit: null,
        data: null,
    },
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            // show additional form
            case SEND.SET_ADDITIONAL_FORM_VISIBILITY: {
                draft.isAdditionalFormVisible = !state.isAdditionalFormVisible;
                break;
            }

            // change input "Address"
            case SEND.HANDLE_ADDRESS_CHANGE: {
                const { address, symbol } = action;
                draft.errors.address = null;
                draft.address = address;

                if (validator.isEmpty(address)) {
                    draft.errors.address = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!isAddressValid(action.address, symbol)) {
                    draft.errors.address = VALIDATION_ERRORS.NOT_VALID;
                    return draft;
                }
                break;
            }

            // change input "Amount"
            case SEND.HANDLE_AMOUNT_CHANGE: {
                const { amount, availableBalance } = action;
                draft.errors.amount = null;
                draft.amount = amount;

                if (validator.isEmpty(amount)) {
                    draft.errors.amount = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!validator.isNumeric(amount)) {
                    draft.errors.amount = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                if (availableBalance < amount || availableBalance === '0') {
                    draft.errors.amount = VALIDATION_ERRORS.NOT_ENOUGH;
                    return draft;
                }

                break;
            }

            // change select "Currency"
            case SEND.HANDLE_SELECT_CURRENCY_CHANGE: {
                const { localCurrency } = action;
                draft.localCurrency = localCurrency;
                break;
            }

            // change input "Fiat"
            case SEND.HANDLE_FIAT_VALUE_CHANGE: {
                const { fiatValue } = action;
                draft.fiatValue = fiatValue;
                break;
            }

            // click button "SetMax"
            case SEND.SET_MAX: {
                return state;
            }

            // click button "Clear"
            case SEND.CLEAR: {
                return {
                    ...initialState,
                    isAdditionalFormVisible: draft.isAdditionalFormVisible,
                };
            }

            // no default
        }
    });
};
