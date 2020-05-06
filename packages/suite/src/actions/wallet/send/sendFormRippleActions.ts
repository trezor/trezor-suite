import TrezorConnect, { RipplePayment } from 'trezor-connect';
import Bignumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { XRP_FLAG } from '@wallet-constants/sendForm';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import * as commonActions from './sendFormCommonActions';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import {
    calculateMax,
    calculateTotal,
    getOutput,
    getReserveInXrp,
} from '@wallet-utils/sendFormUtils';
import { Dispatch, GetState } from '@suite-types';

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
    Check destination account reserve
*/

export const checkAccountReserve = (outputId: number, address: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    const output = getOutput(send.outputs, outputId);

    dispatch({
        type: SEND.AMOUNT_LOADING,
        isLoading: true,
        outputId: output.id,
    });

    if (!address) return null;

    const response = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        descriptor: address,
    });

    // TODO: handle error state

    if (response.success) {
        dispatch({
            type: SEND.XRP_IS_DESTINATION_ACCOUNT_EMPTY,
            isDestinationAccountEmpty: response.payload.empty,
            reserve: getReserveInXrp(account),
        });
    }

    dispatch({
        type: SEND.AMOUNT_LOADING,
        isLoading: false,
        outputId: output.id,
    });
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

/*
    Send transaction
 */
export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const selectedDevice = getState().suite.device;
    if (!send || !selectedDevice || selectedAccount.status !== 'loaded') return;

    const { account } = selectedAccount;
    const { symbol } = account;
    const { selectedFee, outputs, networkTypeRipple } = send;
    const amount = outputs[0].amount.value;
    const address = outputs[0].address.value;
    const destinationTag = networkTypeRipple.destinationTag.value;

    if (account.networkType !== 'ripple' || !amount || !address) return null;

    const payment: RipplePayment = {
        destination: address,
        amount: networkAmountToSatoshi(amount, symbol),
    };

    if (destinationTag) {
        payment.destinationTag = parseInt(destinationTag, 10);
    }

    const { path, instance, state, useEmptyPassphrase } = selectedDevice;
    const signedTx = await TrezorConnect.rippleSignTransaction({
        device: {
            path,
            instance,
            state,
        },
        useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: selectedFee.feePerUnit,
            flags: XRP_FLAG,
            sequence: account.misc.sequence,
            payment,
        },
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: signedTx.payload.serializedTx,
        coin: account.symbol,
    });

    if (sentTx.success) {
        dispatch(commonActions.clear());
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: `${amount} ${account.symbol.toUpperCase()}`,
                device: selectedDevice,
                descriptor: account.descriptor,
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
