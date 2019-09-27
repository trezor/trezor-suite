import TrezorConnect, { PrecomposedTransaction } from 'trezor-connect';
import * as notificationActions from '@suite-actions/notificationActions';
import { Output } from '@wallet-types/sendForm';
import { SEND } from '@wallet-actions/constants';
import { getAccountKey } from '@wallet-utils/reducerUtils';
import { DEFAULT_LOCAL_CURRENCY } from '@wallet-constants/sendForm';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';
import * as sendFormCacheActions from '../sendFormCacheActions';

export type SendFormBitcoinActions =
    | { type: typeof SEND.BTC_ADD_RECIPIENT; newOutput: Output }
    | { type: typeof SEND.BTC_REMOVE_RECIPIENT; outputId: number }
    | { type: typeof SEND.BTC_PRECOMPOSED_TX; payload: PrecomposedTransaction };

/**
 *    Creates new output (address, amount, fiatValue, localCurrency)
 */
export const addRecipient = () => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    const { outputs } = send;
    const outputsCount = outputs.length;
    const lastOutput = outputs[outputsCount - 1];
    const lastOutputId = lastOutput.id;

    const newOutput = {
        id: lastOutputId + 1,
        address: { value: null, error: null },
        amount: { value: null, error: null },
        fiatValue: { value: null },
        localCurrency: { value: DEFAULT_LOCAL_CURRENCY }, // TODO add from settings
    };

    dispatch({
        type: SEND.BTC_ADD_RECIPIENT,
        newOutput,
    });

    // save to cache
    dispatch(
        sendFormCacheActions.cache(
            getAccountKey(account.descriptor, account.symbol, account.deviceState),
            send,
        ),
    );
};

/**
 *    Removes added output (address, amount, fiatValue, localCurrency)
 */
export const removeRecipient = (outputId: number) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    dispatch({ type: SEND.BTC_REMOVE_RECIPIENT, outputId });

    // save to cache
    dispatch(
        sendFormCacheActions.cache(
            getAccountKey(account.descriptor, account.symbol, account.deviceState),
            send,
        ),
    );
};

export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const selectedDevice = getState().suite.device;
    const account = selectedAccount.account as Account;
    if (!send || !send.networkTypeBitcoin.transactionInfo || !selectedDevice) return;

    const { transactionInfo } = send.networkTypeBitcoin;
    if (!transactionInfo || transactionInfo.type !== 'final') return;
    const { transaction } = transactionInfo;

    const resp = await TrezorConnect.signTransaction({
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        outputs: transaction.outputs,
        inputs: transaction.inputs,
        coin: account.symbol,
        push: true,
    });

    if (resp.success) {
        dispatch({ type: SEND.CLEAR });
        dispatch(
            notificationActions.add({
                variant: 'success',
                title: `Success: ${resp.payload.txid}`,
                cancelable: true,
            }),
        );
    } else {
        dispatch(
            notificationActions.add({
                variant: 'error',
                title: `Error: ${resp.payload.error}`,
                cancelable: true,
            }),
        );
    }
};

export const compose = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const account = selectedAccount.account as Account;
    if (!send || !account.addresses || !account.utxo) return;
    // TODO: validate if form has errors

    const { outputs } = send;
    const composedOutputs = outputs.map(o => {
        if (o.address.value) {
            return {
                address: o.address.value,
                amount: o.amount.value || '0',
            } as const;
        }
        return {
            type: 'noaddress',
            amount: o.amount.value || '0',
        } as const;
    });

    // const composedOutputs = [
    //     // { amount: '1', type: 'noaddress' },
    //     // { amount: '1', type: 'sendmax-noaddress' },
    //     { amount: '100000', address: 'tb1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt96jk9x' },
    //     { amount: '200000', address: 'tb1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt96jk9x' },
    // ];

    const resp = await TrezorConnect.composeTransaction({
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: account.utxo,
        },
        feeLevels: [send.selectedFee],
        outputs: composedOutputs,
        coin: account.symbol,
    });

    if (resp.success) {
        const tx = resp.payload[0];
        // if (tx.type === 'final') {
        //     console.log('CALING CONNECT resp', resp);
        // } else if (tx.type === 'nonfinal') {
        //     console.log('CALING CONNECT resp', resp);
        // } else if (tx.type === 'error') {
        //     console.log('CALING CONNECT resp', resp);
        // }

        dispatch({
            type: SEND.BTC_PRECOMPOSED_TX,
            payload: tx,
        });
    } else {
        dispatch({
            type: SEND.BTC_PRECOMPOSED_TX,
            payload: {
                type: 'error',
                error: resp.payload.error,
            },
        });
    }
};
