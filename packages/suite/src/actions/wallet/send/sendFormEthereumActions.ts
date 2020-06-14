import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { toWei } from 'web3-utils';
import {
    prepareEthereumTransaction,
    serializeEthereumTx,
    calculateEthFee,
    calculateMax,
    calculateTotal,
} from '@wallet-utils/sendFormUtils';
import { Dispatch, GetState } from '@suite-types';

/*
    Compose eth transaction
 */
export const compose = (setMax = false) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded' || !send) return null;
    const { account } = selectedAccount;
    const { selectedFee } = send;
    const { token } = send.networkTypeEthereum;
    const isFeeValid = !new BigNumber(selectedFee.feePerUnit).isNaN();

    let tx;
    const output = getOutput(send.outputs, 0);
    const { availableBalance } = account;
    const feeInSatoshi = calculateEthFee(
        toWei(isFeeValid ? selectedFee.feePerUnit : '0', 'gwei'),
        selectedFee.feeLimit || '0',
    );
    const max = token
        ? new BigNumber(token.balance!)
        : new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    // use max possible value or input.value
    // race condition when switching between tokens with set-max enabled
    // input still holds previous value (previous token max)
    const amountInSatoshi = setMax
        ? max.toString()
        : networkAmountToSatoshi(output.amount.value, account.symbol).toString();
    const totalSpentBig = new BigNumber(
        calculateTotal(token ? '0' : amountInSatoshi, feeInSatoshi),
    );
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        feePerUnit: send.selectedFee.feePerUnit,
        max: max.isLessThan('0') ? '0' : max.toString(),
    };

    // TODO: i'm not sure why this validation is duplicated here and in sendFormReducer, investigate more...
    // TODO: action.payload.error should use VALIDATION_ERRORS or TRANSLATION_ID
    if (totalSpentBig.isGreaterThan(availableBalance)) {
        const error = token ? 'NOT-ENOUGH-CURRENCY-FEE' : 'NOT-ENOUGH-FUNDS';
        tx = { type: 'error', error } as const;
        dispatch({
            type: SEND.ETH_PRECOMPOSED_TX,
            payload: tx,
        });
    } else if (!output.address.value) {
        dispatch({
            type: SEND.ETH_PRECOMPOSED_TX,
            payload: {
                type: 'nonfinal',
                ...payloadData,
            },
        });
        tx = { type: 'nonfinal', ...payloadData } as const;
    } else {
        dispatch({
            type: SEND.ETH_PRECOMPOSED_TX,
            payload: {
                type: 'final',
                ...payloadData,
            },
        });
        tx = { type: 'final', ...payloadData } as const;
    }

    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: false });

    return tx;
};

/*
    Sign transaction
 */
export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    const selectedDevice = getState().suite.device;
    if (selectedAccount.status !== 'loaded' || !send || !selectedDevice) return null;
    const { account, network } = selectedAccount;
    const amount = send.outputs[0].amount.value;
    const address = send.outputs[0].address.value;
    if (account.networkType !== 'ethereum' || !network.chainId || !amount || !address) return null;
    const { token, data, gasPrice, gasLimit } = send.networkTypeEthereum;

    const transaction = prepareEthereumTransaction({
        token,
        chainId: network.chainId,
        to: address,
        amount,
        data: data.value,
        gasLimit: gasLimit.value,
        gasPrice: gasPrice.value,
        nonce: account.misc.nonce,
    });

    const signedTx = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        path: account.path,
        transaction,
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: signedTx.payload.error }),
        );
        return;
    }

    const serializedTx = serializeEthereumTx({
        ...transaction,
        ...signedTx.payload,
    });

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: serializedTx,
        coin: network.symbol,
    });

    if (sentTx.success) {
        const symbol = token ? token.symbol!.toUpperCase() : account.symbol.toUpperCase();
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: `${amount} ${symbol}`,
                device: selectedDevice,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );
        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }
};
