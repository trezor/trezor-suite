import * as notificationActions from '@suite-actions/notificationActions';
import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { XRP_FLAG, VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { networkAmountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { calculateMax, calculateTotal, getOutput } from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
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
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
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
    Check destination account reserve
*/

export const checkAccountReserve = (outputId: number, amount: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    if (account.networkType !== 'ripple') return null;
    const { misc } = account;
    const output = getOutput(send.outputs, outputId);

    dispatch({
        type: SEND.AMOUNT_LOADING,
        isLoading: true,
        outputId: output.id,
    });

    const address = output.address.value;
    const amountBig = new BigNumber(amount);

    if (!address || !amount || !misc) return null;

    const response = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        descriptor: address,
    });

    // TODO: handle error state
    if (response.success) {
        const targetAccountBalance = formatNetworkAmount(response.payload.balance, account.symbol);
        const reserve = formatNetworkAmount(misc.reserve, account.symbol);
        const targetAccountIsActive = new BigNumber(targetAccountBalance).isGreaterThan(reserve);
        const error =
            !targetAccountIsActive && amountBig.isLessThan(reserve)
                ? VALIDATION_ERRORS.XRP_CANNOT_SEND_LESS_THAN_RESERVE
                : undefined;

        console.log('error', error);

        dispatch({
            type: SEND.AMOUNT_LOADING,
            isLoading: false,
            outputId: output.id,
        });
    }
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
