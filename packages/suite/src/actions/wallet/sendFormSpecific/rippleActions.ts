import TrezorConnect from 'trezor-connect';
import { calculateTotal, getOutput, calculateMax } from '@wallet-utils/sendFormUtils';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { XRP_FLAG } from '@wallet-constants/sendForm';
import { SEND } from '@wallet-actions/constants';
import Bignumber from 'bignumber.js';
import { PrecomposedTransactionXrp } from '@wallet-types/sendForm';
import { NOTIFICATION } from '@suite-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export type SendFormRippleActions =
    | { type: typeof SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE; destinationTag: string }
    | { type: typeof SEND.XRP_PRECOMPOSED_TX; payload: PrecomposedTransactionXrp };

/*
    Compose xrp transaction
 */
export const compose = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    const output = getOutput(send.outputs, 0);
    const amountInSatoshi = networkAmountToSatoshi(output.amount.value, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = send.selectedFee.value;
    let tx;
    const totalSpentBig = new Bignumber(calculateTotal(amountInSatoshi, feeInSatoshi));

    const max = new Bignumber(calculateMax(availableBalance, feeInSatoshi));
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        max: max.isLessThan('0') ? '0' : max.toString(),
    };

    if (!output.address.value) {
        dispatch({
            type: SEND.XRP_PRECOMPOSED_TX,
            payload: {
                type: 'nonfinal',
                ...payloadData,
            },
        });
        tx = { type: 'nonfinal', ...payloadData } as const;
    } else if (totalSpentBig.isGreaterThan(availableBalance)) {
        dispatch({
            type: SEND.XRP_PRECOMPOSED_TX,
            payload: {
                type: 'error',
                error: 'NOT-ENOUGH-FUNDS',
            },
        });
        tx = { type: 'error', error: 'NOT-ENOUGH-FUNDS' } as const;
    } else {
        dispatch({
            type: SEND.XRP_PRECOMPOSED_TX,
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
    Change value in input "destination tag"
 */
export const handleDestinationTagChange = (destinationTag: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE,
        destinationTag,
    });
};

interface Payment {
    destination: string | null;
    destinationTag?: number | null;
    amount: string | null;
}

/*
    Send transaction
 */
export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send) return;
    const { account } = selectedAccount;
    // Fee must be in the range of 10 to 10,000 drops
    const { selectedFee, outputs, networkTypeRipple } = send;
    const { destinationTag } = networkTypeRipple;
    const selectedDevice = getState().suite.device;
    if (!account || account.networkType !== 'ripple' || !selectedDevice || !destinationTag)
        return null;

    const payment: Payment = {
        destination: outputs[0].address.value,
        amount: networkAmountToSatoshi(outputs[0].amount.value, account.symbol),
    };

    if (destinationTag.value) {
        payment.destinationTag = parseInt(destinationTag.value || '0', 10);
    }

    // @ts-ignore
    const signedTransaction = await TrezorConnect.rippleSignTransaction({
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: selectedFee.feePerUnit,
            flags: XRP_FLAG,
            sequence: account.misc.sequence,
            payment,
        },
    });

    if (!signedTransaction || !signedTransaction.success) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'error',
                title: 'Sign tx error', // TODO
                message: signedTransaction.payload.error,
                cancelable: true,
                actions: [],
            },
        });
        return;
    }

    const push = await TrezorConnect.pushTransaction({
        tx: signedTransaction.payload.serializedTx,
        coin: account.symbol,
    });

    if (!push.success) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'error',
                title: 'Error', // TODO
                message: push.payload.error,
                cancelable: true,
                actions: [],
            },
        });
    } else {
        const { txid } = push.payload;

        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'success',
                title: 'success',
                message: txid,
                cancelable: true,
                actions: [],
            },
        });
    }
};
