import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { applyChange } from '../sendFormActions';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import {
    calculateMax,
    calculateTotal,
    getOutput,
    calculateEthFee,
} from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';

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
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
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
export const handleGasPrice = (gasPrice: string) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    const gasLimit = send.networkTypeEthereum.gasLimit.value;
    const fee = calculateEthFee(gasPrice, gasLimit);

    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: fee,
            blocks: 2,
            value: fee,
        },
    });

    dispatch({
        type: SEND.ETH_HANDLE_GAS_PRICE,
        gasPrice,
    });

    dispatch(applyChange());
};

/*
    Change value in input "gas limit "
 */
export const handleGasLimit = (gasLimit: string) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    const gasPrice = send.networkTypeEthereum.gasPrice.value;
    const fee = calculateEthFee(gasPrice, gasLimit);

    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: fee,
            blocks: 2,
            value: fee,
        },
    });

    dispatch({
        type: SEND.ETH_HANDLE_GAS_LIMIT,
        gasLimit,
    });

    dispatch(applyChange());
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
