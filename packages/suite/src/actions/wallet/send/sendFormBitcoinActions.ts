import TrezorConnect, { FeeLevel, PrecomposedTransaction, SignTransaction } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { FormState, SendContextProps, PrecomposedLevels } from '@wallet-types/sendForm';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import { requestPushTransaction } from '@wallet-actions/sendFormActions'; // move to common?
import { SEND } from '@wallet-actions/constants';
import {
    ZEC_SIGN_ENHANCEMENT,
    BTC_RBF_SEQUENCE,
    BTC_LOCKTIME_SEQUENCE,
} from '@wallet-constants/sendForm';
import { Dispatch, GetState } from '@suite-types';

export const composeTransaction = async (
    formValues: FormState,
    account: SendContextProps['account'],
    feeInfo: SendContextProps['feeInfo'],
) => {
    const { outputs } = formValues;
    if (!account.addresses || !account.utxo) return;

    const composedOutputs = outputs
        .map((output, index) => {
            if (output.type === 'opreturn') {
                return {
                    type: 'opreturn',
                    dataHex: output.dataHex,
                } as const;
            }

            const { address } = output;
            const isMaxActive = formValues.setMaxOutputId === index;
            if (isMaxActive) {
                if (address) {
                    return {
                        address,
                        type: 'send-max',
                    } as const;
                }

                return {
                    type: 'send-max-noaddress',
                } as const;
            }

            const amount = networkAmountToSatoshi(output.amount, account.symbol);
            if (address) {
                return {
                    address,
                    amount,
                } as const;
            }

            return {
                type: 'noaddress',
                amount,
            } as const;
        })
        .filter(output => !output.amount || output.amount !== '0');

    if (composedOutputs.length < 1) return;

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
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
        outputs: composedOutputs,
        coin: account.symbol,
    };

    const response = await TrezorConnect.composeTransaction({
        ...params,
        account: params.account, // needs to be present in order to correct resolve of trezor-connect params overload
    });

    if (!response.success) return; // TODO: show toast?

    const wrappedResponse: PrecomposedLevels = {};

    response.payload.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');

    // there is no valid tx in predefinedLevels and there is no custom level
    if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        const { minFee } = feeInfo;
        console.warn('LEVELS', predefinedLevels);
        let maxFee = new BigNumber(predefinedLevels[predefinedLevels.length - 1].feePerUnit).minus(
            1,
        );
        const customLevels: any[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom' });
            maxFee = maxFee.minus(1);
        }

        console.warn('CUSTOM LEVELS!', customLevels, wrappedResponse);

        if (!customLevels.length) return wrappedResponse;

        const customLevelsResponse = await TrezorConnect.composeTransaction({
            ...params,
            account: params.account, // needs to be present in order to correct resolve type of trezor-connect params overload
            feeLevels: customLevels,
        });

        console.warn('CUSTOM LEVELS RESPONSE', customLevelsResponse);

        if (!customLevelsResponse.success) return wrappedResponse; // TODO: show toast?

        const customValid = customLevelsResponse.payload.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            wrappedResponse.custom = customLevelsResponse.payload[customValid];
        }
    }

    return wrappedResponse;
};

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransaction,
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

    dispatch({
        type: SEND.REQUEST_SIGN_TRANSACTION,
        payload: {
            formValues,
            transactionInfo,
        },
    });

    const { account } = selectedAccount;
    const { transaction } = transactionInfo;

    let sequence: number;
    let signEnhancement: Partial<SignTransaction> = {};

    if (account.symbol === 'zec') {
        signEnhancement = ZEC_SIGN_ENHANCEMENT;
    }

    if (formValues.bitcoinRBF) {
        // RBF is set, add sequence to inputs
        sequence = BTC_RBF_SEQUENCE;
    } else if (formValues.bitcoinLockTime) {
        // locktime is set, add sequence to inputs and add enhancement params
        sequence = BTC_LOCKTIME_SEQUENCE;
        signEnhancement.locktime = new BigNumber(formValues.bitcoinLockTime).toNumber();
    }

    const inputs = transaction.inputs
        .map(input => ({
            ...input,
            sequence,
        }))
        .filter(input => input.amount !== '0'); // remove '0' amounts

    inputs.forEach(input => {
        if (!input.amount) delete input.amount; // remove undefined amounts
        if (!input.sequence) delete input.sequence; // remove undefined sequence
    });

    const signPayload = {
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        outputs: transaction.outputs,
        inputs,
        coin: account.symbol,
        ...signEnhancement,
    };

    const signedTx = await TrezorConnect.signTransaction(signPayload);

    if (!signedTx.success) {
        // catch manual error from cancelSigning
        if (signedTx.payload.error === 'tx-cancelled') return;
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    return dispatch(
        requestPushTransaction({
            tx: signedTx.payload.serializedTx,
            coin: account.symbol,
        }),
    );
};
