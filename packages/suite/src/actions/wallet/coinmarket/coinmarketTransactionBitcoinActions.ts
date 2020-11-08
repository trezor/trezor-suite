import TrezorConnect, { FeeLevel, SignTransaction, TransactionOutput } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import {
    ComposeTransactionData,
    ReviewTransactionData,
    SignTransactionData,
} from '@wallet-types/transaction';
import * as notificationActions from '@suite-actions/notificationActions';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getBitcoinComposeOutputs } from '@wallet-utils/exchangeFormUtils';
import { ZEC_SIGN_ENHANCEMENT } from '@wallet-constants/sendForm';
import { PrecomposedLevels, PrecomposedTransaction } from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';

export const composeTransaction = (composeTransactionData: ComposeTransactionData) => async (
    dispatch: Dispatch,
) => {
    const { account, feeInfo } = composeTransactionData;
    if (!account.addresses || !account.utxo) return;

    const composeOutputs = getBitcoinComposeOutputs(composeTransactionData);
    if (composeOutputs.length < 1) return;

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (composeTransactionData.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: composeTransactionData.feePerUnit,
            blocks: -1,
        });
    }
    const params = {
        account: {
            path: account.path,
            addresses: account.addresses,
            // it is technically possible to have utxo with amount '0' see: https://tbtc1.trezor.io/tx/352873fe6cd5a83ca4b02737848d7d839aab864b8223c5ba7150ae35c22f4e38
            // however they should be excluded to avoid increase fee
            // TODO: this should be fixed in TrezorConnect + hd-wallet.composeTx? (connect throws: 'Segwit output without amount' error)
            utxo: account.utxo.filter(input => input.amount !== '0'),
        },
        feeLevels: predefinedLevels,
        outputs: composeOutputs,
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

    // make sure that feePerByte is an integer (trezor-connect may return float)
    // format max (trezor-connect sends it as satoshi)
    // format errorMessage and catch unexpected error (other than AMOUNT_IS_NOT_ENOUGH)
    Object.keys(wrappedResponse).forEach(key => {
        const tx = wrappedResponse[key];
        if (tx.type !== 'error') {
            tx.feePerByte = new BigNumber(tx.feePerByte)
                .integerValue(BigNumber.ROUND_FLOOR)
                .toString();
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

// TODO - maybe move to some utils
export const outputsWithFinalAddress = (address: string, outputs: TransactionOutput[]) => {
    let updatedOutputsCount = 0;
    const updatedOutputs = outputs.map(o => {
        const updated = { ...o };
        // find the output which has address, other outputs are change outputs, specified by address_n
        if (o.address) {
            updatedOutputsCount++;
            updated.address = address;
        }
        return updated;
    });
    // sanity check
    if (updatedOutputsCount !== 1) {
        return undefined;
    }
    return updatedOutputs;
};

export const signTransaction = (data: SignTransactionData) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    const { transactionInfo, address } = data;
    if (selectedAccount.status !== 'loaded' || !device || !transactionInfo) return;

    // transactionInfo needs some additional changes:
    const { account } = selectedAccount;
    const { transaction } = transactionInfo;
    let signEnhancement: Partial<SignTransaction> = {};

    // enhance signTransaction params for zcash (version_group_id etc.)
    if (account.symbol === 'zec') {
        signEnhancement = ZEC_SIGN_ENHANCEMENT;
    }

    const updatedOutputs = outputsWithFinalAddress(address, transaction.outputs);
    if (!updatedOutputs) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: 'Invalid transaction outputs',
            }),
        );
        return;
    }

    // update inputs
    // TODO: 0 amounts should be excluded together with "exclude dustLimit" feature and "utxo picker" feature in composeTransaction (above)
    const inputs = transaction.inputs
        .map(input => ({
            ...input,
        }))
        .filter(input => input.amount !== '0'); // remove '0' amounts
    inputs.forEach(input => {
        if (!input.amount) delete input.amount; // remove undefined amounts
        if (!input.sequence) delete input.sequence;
    });

    const signPayload = {
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        outputs: updatedOutputs,
        inputs,
        coin: account.symbol,
        ...signEnhancement,
    };

    const reviewData: ReviewTransactionData = {
        signedTx: undefined,
        transactionInfo: {
            ...transactionInfo,
            transaction: { ...transaction, inputs, outputs: updatedOutputs },
        },
    };
    await dispatch(coinmarketCommonActions.saveTransactionReview(reviewData));

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

    return {
        ...reviewData,
        signedTx: {
            tx: signedTx.payload.serializedTx,
            coin: account.symbol,
        },
    };
};
