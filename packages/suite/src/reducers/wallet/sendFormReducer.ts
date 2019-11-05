import { SEND } from '@wallet-actions/constants';
import { NETWORK_TYPE } from '@wallet-constants/account';
import { FIRST_OUTPUT_ID, U_INT_32, VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { WalletAction } from '@wallet-types';
import { InitialState, Output, State } from '@wallet-types/sendForm';
import { getOutput, hasDecimals } from '@wallet-utils/sendFormUtils';
import { isAddressValid } from '@wallet-utils/validation';
import Bignumber from 'bignumber.js';
import produce from 'immer';
import validator from 'validator';

const initialState = (
    loaded: InitialState,
    localCurrency: Output['localCurrency']['value'],
): State => ({
    deviceState: '',
    outputs: [
        {
            // fill first output by default
            id: FIRST_OUTPUT_ID,
            address: { value: null, error: null },
            amount: { value: null, error: null },
            fiatValue: { value: null },
            localCurrency: { value: localCurrency },
        },
    ],
    isComposing: false,
    customFee: { value: null, error: null },
    isAdditionalFormVisible: false,
    networkTypeRipple: {
        transactionInfo: null,
        destinationTag: {
            value: null,
            error: null,
        },
    },
    networkTypeEthereum: {
        transactionInfo: null,
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
    if (action.type === SEND.INIT) return initialState(action.payload, action.localCurrency);
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
                const { outputId, address, symbol, currentAccountAddress, networkType } = action;
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

                if (networkType === 'ripple' && currentAccountAddress === address) {
                    output.address.error = VALIDATION_ERRORS.CANNOT_SEND_TO_MYSELF;
                    return draft;
                }
                break;
            }

            // change input "Amount"
            case SEND.HANDLE_AMOUNT_CHANGE: {
                const { outputId, amount, decimals, availableBalance } = action;
                const output = getOutput(draft.outputs, outputId);
                const amountBig = new Bignumber(amount);

                output.amount.error = null;
                output.amount.value = amount;

                if (validator.isEmpty(amount) || amountBig.isEqualTo(0)) {
                    output.amount.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (amountBig.isGreaterThan(availableBalance)) {
                    output.amount.error = VALIDATION_ERRORS.NOT_ENOUGH;
                    return draft;
                }

                if (!validator.isNumeric(amount)) {
                    output.amount.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                if (!hasDecimals(amount, decimals)) {
                    output.amount.error = VALIDATION_ERRORS.NOT_IN_RANGE_DECIMALS;
                    return draft;
                }

                break;
            }

            // change select "Currency"
            case SEND.HANDLE_SELECT_CURRENCY_CHANGE: {
                const { outputId, localCurrency } = action;
                const output = getOutput(draft.outputs, outputId);
                output.localCurrency.value = localCurrency;
                return draft;
            }

            // change select "Fee"
            case SEND.HANDLE_FEE_VALUE_CHANGE:
                draft.selectedFee = action.fee;
                return draft;

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
                return draft;
            }

            // click button "SetMax"
            case SEND.SET_MAX: {
                return state;
            }

            case SEND.COMPOSE_PROGRESS: {
                draft.isComposing = action.isComposing;
                return draft;
            }

            case SEND.DELETE_TRANSACTION_INFO: {
                const { networkType } = action;
                switch (networkType) {
                    case NETWORK_TYPE.BITCOIN:
                        draft.networkTypeBitcoin.transactionInfo = null;
                        return draft;
                    case NETWORK_TYPE.ETHEREUM:
                        draft.networkTypeEthereum.transactionInfo = null;
                        return draft;
                    case NETWORK_TYPE.RIPPLE:
                        draft.networkTypeRipple.transactionInfo = null;
                        return draft;
                    // no default
                }
                break;
            }

            // click button "Clear"
            case SEND.CLEAR: {
                return initialState(
                    {
                        feeInfo: draft.feeInfo,
                        selectedFee:
                            draft.feeInfo.levels.find(f => f.label === 'normal') ||
                            draft.feeInfo.levels[0],
                        isAdditionalFormVisible: draft.isAdditionalFormVisible,
                    },
                    action.localCurrency,
                );
            }

            /* 
                BTC specific
            */

            // click button "Add recipient"
            case SEND.BTC_ADD_RECIPIENT: {
                const { newOutput } = action;
                draft.outputs.push(newOutput);
                return draft;
            }

            // click button "Remove recipient"
            case SEND.BTC_REMOVE_RECIPIENT: {
                const { outputId } = action;
                const removed = draft.outputs.filter(output => output.id !== outputId);
                draft.outputs = removed;
                return draft;
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
                return draft;
            }

            /* 
                XRP specific
            */

            case SEND.XRP_PRECOMPOSED_TX: {
                draft.networkTypeRipple.transactionInfo = action.payload;

                if (
                    action.payload.type === 'error' &&
                    action.payload.error === 'NOT-ENOUGH-FUNDS'
                ) {
                    draft.outputs.map(
                        output => (output.amount.error = VALIDATION_ERRORS.NOT_ENOUGH),
                    );
                }
                return draft;
            }

            case SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE: {
                const { destinationTag } = action;
                draft.networkTypeRipple.destinationTag.error = null;
                draft.networkTypeRipple.destinationTag.value = destinationTag;

                if (!validator.isNumeric(destinationTag)) {
                    draft.networkTypeRipple.destinationTag.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                if (parseInt(destinationTag, 10) > U_INT_32) {
                    draft.networkTypeRipple.destinationTag.error = VALIDATION_ERRORS.NOT_VALID;
                    return draft;
                }

                return draft;
            }

            /* 
                ETH specific
            */

            // no default
        }
    });
};
