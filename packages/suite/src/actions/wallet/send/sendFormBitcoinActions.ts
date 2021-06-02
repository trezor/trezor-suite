import TrezorConnect, { FeeLevel, SignTransaction } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as notificationActions from '@suite-actions/notificationActions';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getBitcoinComposeOutputs } from '@wallet-utils/sendFormUtils';
import {
    ZEC_SIGN_ENHANCEMENT,
    BTC_RBF_SEQUENCE,
    BTC_LOCKTIME_SEQUENCE,
} from '@wallet-constants/sendForm';
import {
    FormState,
    UseSendFormState,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
} from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';

export const composeTransaction = (formValues: FormState, formState: UseSendFormState) => async (
    dispatch: Dispatch,
) => {
    const { account, feeInfo } = formState;
    if (!account.addresses || !account.utxo) return;

    const composeOutputs = getBitcoinComposeOutputs(formValues, account.symbol);
    if (composeOutputs.length < 1) return;

    // clone FeeLevels in rbf, the will be modified later
    const levels = formValues.rbfParams ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
    const predefinedLevels = levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            blocks: -1,
        });
    }

    // FeeLevels in rbf form are increased by original/prev rate
    // decrease it since the calculation (in connect) is based on the baseFee not the prev rate
    const origRate = formValues.rbfParams ? parseInt(formValues.rbfParams.feeRate, 10) : undefined;
    if (origRate) {
        predefinedLevels.forEach(l => {
            l.feePerUnit = Number(parseInt(l.feePerUnit, 10) - origRate).toString();
        });
    }

    let sequence = 0;
    if (formValues.options.includes('bitcoinRBF')) {
        // RBF is set, add sequence to inputs
        sequence = BTC_RBF_SEQUENCE;
    } else if (formValues.bitcoinLockTime) {
        // locktime is set, add sequence to inputs
        sequence = BTC_LOCKTIME_SEQUENCE;
    }

    const baseFee = formValues.rbfParams ? formValues.rbfParams.baseFee : 0;
    const params = {
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: account.utxo,
        },
        feeLevels: predefinedLevels,
        baseFee,
        sequence,
        outputs: composeOutputs,
        skipPermutation: baseFee > 0,
        coin: account.symbol,
    };

    const response = await TrezorConnect.composeTransaction({
        ...params,
        account: params.account, // needs to be present in order to correct resolve of trezor-connect params overload
    });

    if (!response.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: response.payload.error,
            }),
        );
        return;
    }

    // wrap response into PrecomposedLevels object where key is a FeeLevel label
    const wrappedResponse: PrecomposedLevels = {};
    response.payload.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx as PrecomposedTransaction;
    });

    const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');
    // there is no valid tx in predefinedLevels and there is no custom level
    if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        const { minFee } = feeInfo;
        const lastKnownFee = predefinedLevels[predefinedLevels.length - 1].feePerUnit;
        // define coefficient for maxFee
        // NOTE: DOGE has very large values of FeeLevels, up to several thousands sat/B, rangeGap should be greater in this case otherwise calculation takes too long
        // TODO: calculate rangeGap more precisely (percentage of range?)
        const range = new BigNumber(lastKnownFee).minus(minFee);
        const rangeGap = range.gt(1000) ? 1000 : 1;
        let maxFee = new BigNumber(lastKnownFee).minus(rangeGap);
        // generate custom levels in range from lastKnownFee minus customGap to feeInfo.minFee (coinInfo in trezor-connect)
        const customLevels: FeeLevel[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
            maxFee = maxFee.minus(rangeGap);
        }

        // check if any custom level is possible
        const customLevelsResponse =
            customLevels.length > 0
                ? await TrezorConnect.composeTransaction({
                      ...params,
                      account: params.account, // needs to be present in order to correct resolve type of trezor-connect params overload
                      feeLevels: customLevels,
                  })
                : ({ success: false } as const);

        if (customLevelsResponse.success) {
            const customValid = customLevelsResponse.payload.findIndex(r => r.type !== 'error');
            if (customValid >= 0) {
                wrappedResponse.custom = customLevelsResponse.payload[
                    customValid
                ] as PrecomposedTransaction;
            }
        }
    }

    // format max (trezor-connect sends it as satoshi)
    // format errorMessage and catch unexpected error (other than AMOUNT_IS_NOT_ENOUGH)
    Object.keys(wrappedResponse).forEach(key => {
        const tx = wrappedResponse[key];
        if (tx.type !== 'error') {
            if (formValues.selectedFee === 'custom' && key === 'custom') {
                // calculated/real feeePerByte may be slightly higher that requested
                // example: spending dust limit, chained txs in rbf...
                // override calculated value
                tx.feePerByte = formValues.feePerUnit;
            } else {
                // make sure that feePerByte is an integer (trezor-connect may return float)
                tx.feePerByte = new BigNumber(tx.feePerByte)
                    .integerValue(BigNumber.ROUND_FLOOR)
                    .toString();
            }
            if (typeof tx.max === 'string') {
                tx.max = formatNetworkAmount(tx.max, account.symbol);
            }
        } else if (tx.error === 'NOT-ENOUGH-FUNDS') {
            tx.errorMessage = { id: 'AMOUNT_IS_NOT_ENOUGH' };
        } else {
            // catch unexpected error
            dispatch(
                notificationActions.addToast({
                    type: 'sign-tx-error',
                    error: tx.error,
                }),
            );
        }
    });

    return wrappedResponse;
};

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionFinal,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (
        selectedAccount.status !== 'loaded' ||
        !device ||
        !transactionInfo ||
        transactionInfo.type !== 'final'
    )
        return;

    // transactionInfo needs some additional changes:
    const { account } = selectedAccount;
    const { transaction } = transactionInfo;

    let signEnhancement: Partial<SignTransaction> = {};
    // enhance signTransaction params for zcash (version_group_id etc.)
    if (account.symbol === 'zec') {
        signEnhancement = ZEC_SIGN_ENHANCEMENT;
    }

    if (formValues.bitcoinLockTime) {
        signEnhancement.locktime = new BigNumber(formValues.bitcoinLockTime).toNumber();
    }

    if (formValues.rbfParams && transactionInfo.useNativeRbf) {
        const { txid, utxo, outputs } = formValues.rbfParams;
        // override inputs and outputs of precomposed transaction
        // NOTE: RBF inputs/outputs required are to be in the same exact order as in original tx (covered by TrezorConnect.composeTransaction.skipPermutation param)
        // possible variations:
        // it's possible to add new utxo not related to the original tx at the end of the list
        // it's possible to add change output if it not exists in original tx AND new utxo was added
        // it's possible to remove original change output completely (give up all as a fee)
        // it's possible to decrease external output in favour of fee
        signEnhancement.inputs = transaction.inputs.map((input, i) => {
            if (utxo[i]) {
                return { ...input, orig_index: i, orig_hash: txid };
            }
            return input;
        });
        signEnhancement.outputs = transaction.outputs.map((output, i) => {
            if (outputs[i]) {
                return { ...output, orig_index: i, orig_hash: txid };
            }
            return output;
        });
    }

    const signPayload = {
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        inputs: transaction.inputs,
        outputs: transaction.outputs,
        account: {
            addresses: account.addresses!,
        },
        coin: account.symbol,
        ...signEnhancement,
    };

    const signedTx = await TrezorConnect.signTransaction(signPayload);

    if (!signedTx.success) {
        // catch manual error from ReviewTransaction modal
        if (signedTx.payload.error === 'tx-cancelled') return;
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    return signedTx.payload.serializedTx;
};
