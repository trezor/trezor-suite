import TrezorConnect, { PrecomposedTransaction } from 'trezor-connect';
import * as notificationActions from '@suite-actions/notificationActions';
import { Output } from '@wallet-types/sendForm';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import { SEND } from '@wallet-actions/constants';
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
    const { send, settings } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account || !settings) return null;

    const { outputs } = send;
    const outputsCount = outputs.length;
    const lastOutput = outputs[outputsCount - 1];
    const lastOutputId = lastOutput.id;
    const localCurrency = getLocalCurrency(settings.localCurrency);

    const newOutput = {
        id: lastOutputId + 1,
        address: { value: null, error: null },
        amount: { value: null, error: null },
        fiatValue: { value: null },
        localCurrency: { value: localCurrency }, // TODO add from settings
    };

    dispatch({
        type: SEND.BTC_ADD_RECIPIENT,
        newOutput,
    });

    dispatch(sendFormCacheActions.cache());
};

/**
 *    Removes added output (address, amount, fiatValue, localCurrency)
 */
export const removeRecipient = (outputId: number) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    dispatch({ type: SEND.BTC_REMOVE_RECIPIENT, outputId });
    dispatch(sendFormCacheActions.cache());
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

    const { outputs } = send;

    const composedOutputs = outputs.map(o => {
        const amount = networkAmountToSatoshi(o.amount.value || '0', account.symbol);

        if (o.address.value) {
            return {
                address: o.address.value,
                amount,
            } as const;
        }

        return {
            type: 'noaddress',
            amount,
        } as const;
    });

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
