import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { BTC_RBF_SEQUENCE, ZEC_SIGN_ENHANCEMENT } from '@wallet-constants/sendForm';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import * as commonActions from './sendFormCommonActions';
import { formatNetworkAmount, networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';

/*
    Compose transaction
 */

export const compose = (setMax = false) => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const account = selectedAccount.account as Account;
    if (!send || !account.addresses || !account.utxo) return;

    const { outputs } = send;

    const composedOutputs = outputs.map(o => {
        const amount = networkAmountToSatoshi(o.amount.value, account.symbol);

        // address is set
        if (o.address.value) {
            // set max without address
            if (setMax) {
                return {
                    address: o.address.value,
                    type: 'send-max',
                } as const;
            }

            return {
                address: o.address.value,
                amount,
            } as const;
        }

        // set max with address only
        if (setMax) {
            return {
                type: 'send-max-noaddress',
            } as const;
        }

        // set amount without address
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

    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: false });

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

    if (resp.success) {
        return resp.payload[0];
    }
};

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
        amount: { value: null, error: null, isLoading: false },
        fiatValue: { value: null },
        localCurrency: { value: localCurrency },
    };

    dispatch({
        type: SEND.BTC_ADD_RECIPIENT,
        newOutput,
    });

    dispatch(commonActions.cache());
};

/**
 *    Removes added output (address, amount, fiatValue, localCurrency)
 */
export const removeRecipient = (outputId: number) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    dispatch({ type: SEND.BTC_REMOVE_RECIPIENT, outputId });
    dispatch(commonActions.cache());
};

/*
    Send transaction
 */
export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const selectedDevice = getState().suite.device;
    const account = selectedAccount.account as Account;
    if (!send || !send.networkTypeBitcoin.transactionInfo || !selectedDevice) return;

    const { transactionInfo } = send.networkTypeBitcoin;

    if (!transactionInfo || transactionInfo.type !== 'final') return;
    const { transaction } = transactionInfo;

    const inputs = transaction.inputs.map(input => ({
        ...input,
        sequence: BTC_RBF_SEQUENCE,
    }));

    let signEnhancement = {};

    if (account.symbol === 'zec') {
        signEnhancement = ZEC_SIGN_ENHANCEMENT;
    }

    // connect undefined amount hotfix (not for zcash)
    inputs.forEach(input => {
        if (!input.amount) delete input.amount;
    });

    const signPayload = {
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        outputs: transaction.outputs,
        inputs,
        coin: account.symbol,
        ...signEnhancement,
    };

    const signedTx = await TrezorConnect.signTransaction(signPayload);

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: signedTx.payload.error }),
        );
        return;
    }

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: signedTx.payload.serializedTx,
        coin: account.symbol,
    });

    const spentWithoutFee = new BigNumber(transactionInfo.totalSpent)
        .minus(transactionInfo.fee)
        .toString();

    if (sentTx.success) {
        dispatch(commonActions.clear());
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: formatNetworkAmount(spentWithoutFee, account.symbol, true),
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
