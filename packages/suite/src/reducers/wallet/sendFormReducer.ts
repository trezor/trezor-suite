import produce from 'immer';
import validator from 'validator';
import { SEND } from '@wallet-actions/constants';
import { getOutput } from '@wallet-utils/sendFormUtils';
import { State, Output } from '@wallet-types/sendForm';
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
            // fill first output by default
            id: FIRST_OUTPUT_ID,
            address: { value: null, error: null },
            amount: { value: null, error: null },
            fiatValue: { value: null },
            localCurrency: { value: DEFAULT_LOCAL_CURRENCY },
        },
    ],
    fee: null,
    // @ts-ignore TODO default custom fee
    customFee: { value: { value: null, error: null }, error: null },
    isAdditionalFormVisible: false,
    networkTypeRipple: {
        destinationTag: {
            value: null,
            error: null,
        },
    },
    networkTypeEthereum: {
        gasPrice: { value: null, error: null },
        gasLimit: { value: null, error: null },
        data: { value: null, error: null },
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
                const { outputId, address, symbol } = action;
                const output = getOutput(draft.outputs, outputId);
                output.address.error = null;
                output.address.value = address;

                if (validator.isEmpty(address)) {
                    output.address.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!isAddressValid(action.address, symbol)) {
                    output.address.error = VALIDATION_ERRORS.NOT_VALID;
                    return draft;
                }
                break;
            }

            // change input "Amount"
            case SEND.HANDLE_AMOUNT_CHANGE: {
                const { outputId, amount, availableBalance } = action;
                const output = getOutput(draft.outputs, outputId);

                output.amount.error = null;
                output.amount.value = amount;

                if (validator.isEmpty(amount)) {
                    output.amount.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!validator.isNumeric(amount)) {
                    output.amount.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                if (availableBalance < amount || availableBalance === '0') {
                    output.amount.error = VALIDATION_ERRORS.NOT_ENOUGH;
                    return draft;
                }

                break;
            }

            // change select "Currency"
            case SEND.HANDLE_SELECT_CURRENCY_CHANGE: {
                const { outputId, localCurrency } = action;
                const output = getOutput(draft.outputs, outputId);
                output.localCurrency.value = localCurrency;
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
                draft.customFee.error = null;
                draft.customFee.value = customFee;

                if (validator.isEmpty(customFee)) {
                    draft.customFee.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!validator.isNumeric(customFee)) {
                    draft.customFee.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }
                break;
            }

            // change input "Fiat"
            case SEND.HANDLE_FIAT_VALUE_CHANGE: {
                const { outputId, fiatValue } = action;
                const output = getOutput(draft.outputs, outputId) as Output;
                output.fiatValue.value = fiatValue;
                break;
            }

            // click button "SetMax"
            case SEND.SET_MAX: {
                return state;
            }

            // click button "Add recipient"
            case SEND.BTC_ADD_RECIPIENT: {
                const { newOutput } = action;
                draft.outputs.push(newOutput);
                break;
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
                draft.networkTypeRipple.destinationTag.error = null;
                draft.networkTypeRipple.destinationTag.value = destinationTag;

                if (!validator.isNumeric(destinationTag)) {
                    draft.networkTypeRipple.destinationTag.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }
                break;
            }

            // no default
        }
    });
};
