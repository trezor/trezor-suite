import produce from 'immer';
import validator from 'validator';
import Bignumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { getOutput } from '@wallet-utils/sendFormUtils';
import { State, InitialState, Output } from '@wallet-types/sendForm';
import {
    VALIDATION_ERRORS,
    FIRST_OUTPUT_ID,
    DEFAULT_LOCAL_CURRENCY,
} from '@wallet-constants/sendForm';
import { isAddressValid } from '@wallet-utils/validation';
import { WalletAction } from '@wallet-types';

const initialState = (loaded: InitialState): State => ({
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
    customFee: { value: null, error: null },
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
    networkTypeBitcoin: {
        transactionInfo: null,
    },
    ...loaded,
});

export default (state: State | null = null, action: WalletAction): State | null => {
    if (action.type === SEND.INIT) return initialState(action.payload);
    if (!state || action.type === SEND.DISPOSE) return null;

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
                const { outputId, amount } = action;
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
            case SEND.HANDLE_FEE_VALUE_CHANGE:
                draft.selectedFee = action.fee;
                break;

            // change select "Fee"
            case SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE: {
                const { customFee } = action;

                draft.customFee.error = null;
                draft.customFee.value = customFee;
                draft.selectedFee.feePerUnit = customFee || '1';

                if (customFee === null) return draft;

                const customFeeBig = new Bignumber(customFee);
                const maxFeeBig = new Bignumber(draft.feeInfo.maxFee);
                const minFeeBig = new Bignumber(draft.feeInfo.minFee);

                if (validator.isEmpty(customFee)) {
                    draft.customFee.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (!validator.isNumeric(customFee)) {
                    draft.customFee.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                if (customFeeBig.isGreaterThan(maxFeeBig) || customFeeBig.isLessThan(minFeeBig)) {
                    draft.customFee.error = VALIDATION_ERRORS.NOT_IN_RANGE;
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

            // click button "Add recipient"
            case SEND.BTC_REMOVE_RECIPIENT: {
                const { outputId } = action;
                const removed = draft.outputs.filter(output => output.id !== outputId);
                draft.outputs = removed;
                break;
            }

            // click button "Clear"
            case SEND.CLEAR: {
                return initialState({
                    feeInfo: draft.feeInfo,
                    selectedFee:
                        draft.feeInfo.levels.find(f => f.label === 'normal') ||
                        draft.feeInfo.levels[0],
                    isAdditionalFormVisible: draft.isAdditionalFormVisible,
                });
            }

            // change input in additional xrp form "Destination tag"
            case SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE: {
                const { destinationTag } = action;
                draft.networkTypeRipple.destinationTag.error = null;
                draft.networkTypeRipple.destinationTag.value = destinationTag;

                if (!validator.isNumeric(destinationTag)) {
                    draft.networkTypeRipple.destinationTag.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }
                break;
            }

            case SEND.BTC_PRECOMPOSED_TX: {
                draft.networkTypeBitcoin.transactionInfo = action.payload;

                if (
                    action.payload.type === 'error' &&
                    action.payload.error === 'NOT-ENOUGH-FUNDS'
                ) {
                    draft.outputs.map(
                        output => (output.amount.error = VALIDATION_ERRORS.NOT_ENOUGH),
                    );
                }
                break;
            }

            case SEND.BTC_DELETE_TRANSACTION_INFO: {
                draft.networkTypeBitcoin.transactionInfo = null;
            }

            // no default
        }
    });
};
