import { SEND } from '@wallet-actions/constants';
import { U_INT_32, VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { WalletAction } from '@wallet-types';
import { Output, State } from '@wallet-types/sendForm';
import { getOutput, hasDecimals } from '@wallet-utils/sendFormUtils';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { isAddressValid } from '@wallet-utils/validation';
import BigNumber from 'bignumber.js';
import produce from 'immer';
import validator from 'validator';

export default (state: State | null = null, action: WalletAction): State | null => {
    if (!state || action.type === SEND.DISPOSE) return null;

    return produce(state, draft => {
        switch (action.type) {
            // show additional form
            case SEND.SET_ADDITIONAL_FORM_VISIBILITY: {
                draft.isAdditionalFormVisible = !state.isAdditionalFormVisible;
                break;
            }

            // set touched
            case SEND.SET_TOUCHED: {
                draft.touched = action.touched;
                break;
            }

            // update fee
            case SEND.UPDATE_FEE: {
                draft.feeInfo = action.feeInfo;
                draft.selectedFee = action.selectedFee;
                if (action.gasLimit && action.gasPrice) {
                    draft.networkTypeEthereum.gasLimit.value = action.gasLimit;
                    draft.networkTypeEthereum.gasPrice.value = action.gasPrice;
                }

                break;
            }

            // change fee state
            case SEND.CHANGE_FEE_STATE: {
                draft.feeOutdated = action.feeOutdated;
                break;
            }

            // change setMax state
            case SEND.CHANGE_SET_MAX_STATE: {
                draft.setMaxActivated = action.activated;
                break;
            }

            // change input "Amount"
            case SEND.HANDLE_AMOUNT_CHANGE: {
                const {
                    outputId,
                    amount,
                    availableBalance,
                    isDestinationAccountEmpty,
                    reserve,
                    symbol,
                } = action;

                const { token } = draft.networkTypeEthereum;
                const decimals = token ? token.decimals : action.decimals;
                const output = getOutput(draft.outputs, outputId);
                const amountBig = new BigNumber(amount);
                const formattedAvailableBalance = token
                    ? token.balance || '0'
                    : formatNetworkAmount(availableBalance, symbol);

                output.amount.error = null;
                output.amount.value = amount;

                if (validator.isEmpty(amount) || amountBig.isEqualTo(0)) {
                    output.amount.error = VALIDATION_ERRORS.IS_EMPTY;
                    return draft;
                }

                if (amountBig.isGreaterThan(formattedAvailableBalance)) {
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

                if (isDestinationAccountEmpty && reserve && amountBig.isLessThan(reserve)) {
                    output.amount.error = VALIDATION_ERRORS.XRP_CANNOT_SEND_LESS_THAN_RESERVE;
                    return draft;
                }

                break;
            }

            // change loading state in "Amount"
            case SEND.AMOUNT_LOADING: {
                const { isLoading, outputId } = action;
                const output = getOutput(draft.outputs, outputId);
                output.amount.isLoading = isLoading;
                return draft;
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

                if (customFee === null) return draft;

                const customFeeBig = new BigNumber(customFee);
                const maxFeeBig = new BigNumber(draft.feeInfo.maxFee);
                const minFeeBig = new BigNumber(draft.feeInfo.minFee);

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

            /* 
                BTC specific
            */

            // compose btc transaction after form change
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

                if (action.payload.type === 'error' && action.payload.error.includes('address')) {
                    draft.outputs.map(
                        output => (output.address.error = VALIDATION_ERRORS.NOT_VALID),
                    );
                }

                return draft;
            }

            /* 
                XRP specific
            */

            // compose xrp transaction after form change
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

            // check if destination account is empty
            case SEND.XRP_IS_DESTINATION_ACCOUNT_EMPTY: {
                draft.networkTypeRipple.isDestinationAccountEmpty =
                    action.isDestinationAccountEmpty;
                return draft;
            }

            // change input "Destination tag"
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

            // compose eth transaction after form change
            case SEND.ETH_PRECOMPOSED_TX: {
                draft.networkTypeEthereum.transactionInfo = action.payload;
                if (
                    action.payload.type === 'error' &&
                    (action.payload.error === 'NOT-ENOUGH-FUNDS' ||
                        action.payload.error === 'NOT-ENOUGH-CURRENCY-FEE')
                ) {
                    // TODO: action.payload.error should use VALIDATION_ERRORS or TRANSLATION_ID
                    const error =
                        action.payload.error === 'NOT-ENOUGH-FUNDS'
                            ? VALIDATION_ERRORS.NOT_ENOUGH
                            : VALIDATION_ERRORS.NOT_ENOUGH_CURRENCY_FEE;
                    draft.outputs.map(output => (output.amount.error = error));
                }
                return draft;
            }

            // change input "Gas limit"
            case SEND.ETH_HANDLE_GAS_LIMIT: {
                const { gasLimit } = action;
                const gasLimitBig = new BigNumber(gasLimit);

                draft.networkTypeEthereum.gasLimit.error = null;
                draft.networkTypeEthereum.gasLimit.value = gasLimit;

                if (!validator.isNumeric(gasLimit) || gasLimitBig.isLessThanOrEqualTo(0)) {
                    draft.networkTypeEthereum.gasLimit.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                return draft;
            }

            // change input "Gas price"
            case SEND.ETH_HANDLE_GAS_PRICE: {
                const { gasPrice } = action;
                const gasPriceBig = new BigNumber(gasPrice);
                draft.networkTypeEthereum.gasPrice.error = null;
                draft.networkTypeEthereum.gasPrice.value = gasPrice;

                if (!validator.isNumeric(gasPrice) || gasPriceBig.isLessThanOrEqualTo(0)) {
                    draft.networkTypeEthereum.gasPrice.error = VALIDATION_ERRORS.NOT_NUMBER;
                    return draft;
                }

                return draft;
            }

            // change input "Data"
            case SEND.ETH_HANDLE_DATA: {
                const { data } = action;
                draft.networkTypeEthereum.data.error = null;
                draft.networkTypeEthereum.data.value = data;

                if (!validator.isHexadecimal(data)) {
                    draft.networkTypeEthereum.data.error = VALIDATION_ERRORS.NOT_HEX;
                    return draft;
                }

                return draft;
            }

            // change token
            case SEND.ETH_HANDLE_TOKEN:
                draft.networkTypeEthereum.token = action.token;
                // reset data
                draft.networkTypeEthereum.data.error = null;
                draft.networkTypeEthereum.data.value = null;
                return draft;

            // no default
        }
    });
};
