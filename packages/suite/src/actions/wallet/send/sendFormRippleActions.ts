import * as notificationActions from '@suite-actions/notificationActions';
import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { XRP_FLAG } from '@wallet-constants/sendForm';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { calculateMax, calculateTotal, getOutput } from '@wallet-utils/sendFormUtils';
import Bignumber from 'bignumber.js';
import TrezorConnect from 'trezor-connect';

/*
    Compose xrp transaction
 */
export const compose = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;

    const output = getOutput(send.outputs, 0);
    const amountInSatoshi = networkAmountToSatoshi(output.amount.value, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = send.selectedFee.feePerUnit;
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
    const selectedDevice = getState().suite.device;
    if (!send || !selectedDevice || selectedAccount.status !== 'loaded') return;

    const { account } = selectedAccount;
    const { selectedFee, outputs, networkTypeRipple } = send;
    const { destinationTag } = networkTypeRipple;

    if (account.networkType !== 'ripple' || !destinationTag) return null;

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
        dispatch(
            notificationActions.add({
                type: 'sign-tx-error',
                error: signedTransaction.payload.error,
            }),
        );
        return;
    }

    const push = await TrezorConnect.pushTransaction({
        tx: signedTransaction.payload.serializedTx,
        coin: account.symbol,
    });

    if (!push.success) {
        dispatch(
            notificationActions.add({
                type: 'sign-tx-error',
                error: push.payload.error,
            }),
        );
    } else {
        dispatch(
            notificationActions.add({
                type: 'sign-tx-success',
                txid: push.payload.txid,
            }),
        );
    }
};
