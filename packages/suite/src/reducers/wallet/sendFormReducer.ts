import produce from 'immer';
import validator from 'validator';
import { SEND } from '@wallet-actions/constants';
import { State } from '@wallet-types/sendForm';
import {
    VALIDATION_ERRORS,
    FIRST_OUTPUT_ID,
    DEFAULT_LOCAL_CURRENCY,
} from '@wallet-constants/sendForm';
import { isAddressValid } from '@wallet-utils/validation';
import { WalletAction } from '@wallet-types';

export const initialState: State = {
    outputs: [
        {
            id: FIRST_OUTPUT_ID,
            address: { value: null, error: null },
            amount: { value: null, error: null },
            fiatValue: { value: null },
            localCurrency: { value: DEFAULT_LOCAL_CURRENCY },
        },
    ],
    fee: null,
    // @ts-ignore TODO default custom fee?
    customFee: { value: { value: null, error: null }, error: null },
    isAdditionalFormVisible: false,
    networkTypeRipple: {
        destinationTag: null,
        errors: {
            destinationTag: null,
        },
    },
    networkTypeEthereum: {
        gasPrice: null,
        gasLimit: null,
        data: null,
    },
    networkTypeBitcoin: {},
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            // show additional form
            case SEND.SET_ADDITIONAL_FORM_VISIBILITY: {
                draft.isAdditionalFormVisible = !state.isAdditionalFormVisible;
                break;
            }

            // change input "Address"
            case SEND.HANDLE_ADDRESS_CHANGE: {
                const { address, symbol, output } = action;
                draft.output.address.error = null;
                draft.output.address.value = address;

                if (validator.isEmpty(address)) {
                    draft.output.address.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!isAddressValid(action.address, symbol)) {
                    draft.output.address.error = VALIDATION_ERRORS.NOT_VALID;
                    return draft;
                }
                break;
            }

            // change input "Amount"
            case SEND.HANDLE_AMOUNT_CHANGE: {
                const { amount, availableBalance, output } = action;
                draft.output.amount.error = null;
                draft.output.amount.value = amount;

                if (validator.isEmpty(amount)) {
                    draft.output.amount.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!validator.isNumeric(amount)) {
                    draft.output.amount.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                if (availableBalance < amount || availableBalance === '0') {
                    draft.output.amount.error = VALIDATION_ERRORS.NOT_ENOUGH;
                    return draft;
                }

                break;
            }

            // change select "Currency"
            case SEND.HANDLE_SELECT_CURRENCY_CHANGE: {
                const { localCurrency, output } = action;
                draft.output.localCurrency.value = localCurrency;
                break;
            }

            // change select "Fee"
            case SEND.HANDLE_FEE_VALUE_CHANGE: {
                const { fee } = action;
                draft.fee = fee;
                break;
            }

            // change select "Fee"
            case SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE: {
                const { customFee } = action;
                draft.output.customFee.error = null;
                draft.output.customFee.value = customFee;

                if (validator.isEmpty(customFee)) {
                    draft.output.customFee.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!validator.isNumeric(customFee)) {
                    draft.output.customFee.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }
                break;
            }

            // change input "Fiat"
            case SEND.HANDLE_FIAT_VALUE_CHANGE: {
                const { output, fiatValue } = action;
                draft.output.fiatValue.value = fiatValue;
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

            // change input in additional xrp form "Destination tag"
            case SEND.HANDLE_XRP_DESTINATION_TAG_CHANGE: {
                const { destinationTag } = action;
                draft.networkTypeRipple.errors.destinationTag = null;
                draft.networkTypeRipple.destinationTag = destinationTag;

                if (!validator.isNumeric(destinationTag)) {
                    draft.networkTypeRipple.errors.destinationTag = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                draft.networkTypeRipple.destinationTag = destinationTag;
                break;
            }

            // no default
        }
    });
};
