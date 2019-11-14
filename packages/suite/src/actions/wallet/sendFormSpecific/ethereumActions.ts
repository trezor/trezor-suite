import { SEND } from '@wallet-actions/constants';
import Bignumber from 'bignumber.js';
import { Dispatch, GetState } from '@suite-types';
import { calculateTotal, getOutput, calculateMax } from '@wallet-utils/sendFormUtils';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';

/*
    Compose eth transaction
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
            type: SEND.ETH_PRECOMPOSED_TX,
            payload: {
                type: 'nonfinal',
                ...payloadData,
            },
        });
        tx = { type: 'nonfinal', ...payloadData } as const;
    } else if (totalSpentBig.isGreaterThan(availableBalance)) {
        dispatch({
            type: SEND.ETH_PRECOMPOSED_TX,
            payload: {
                type: 'error',
                error: 'NOT-ENOUGH-FUNDS',
            },
        });
        tx = { type: 'error', error: 'NOT-ENOUGH-FUNDS' } as const;
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
export const send = () => async () => {
    console.log('send');
};

/*
    Change value in input "gas price"
 */
export const handleGasPrice = (gasPrice: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.ETH_HANDLE_GAS_PRICE,
        gasPrice,
    });
};

/*
    Change value in input "gas limit "
 */
export const handleGasLimit = (gasLimit: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.ETH_HANDLE_GAS_LIMIT,
        gasLimit,
    });
};

/*
    Change value in input "Data"
 */
export const handleData = (data: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.ETH_HANDLE_DATA,
        data,
    });
};
