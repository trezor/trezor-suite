import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import {
    prepareEthereumTransaction,
    calculateEthFee,
    calculateMax,
    calculateTotal,
    getOutput,
} from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
// @ts-ignore
import ethUnits from 'ethereumjs-units';
import TrezorConnect from 'trezor-connect';
import { composeChange } from './sendFormActions';

/*
    Compose eth transaction
 */
export const compose = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    let tx;
    const output = getOutput(send.outputs, 0);
    const amountInSatoshi = networkAmountToSatoshi(output.amount.value, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = send.selectedFee.value;
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
export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    const selectedDevice = getState().suite.device;
    if (selectedAccount.status !== 'loaded' || !send || !selectedDevice) return null;
    const { account, network } = selectedAccount;
    if (account.networkType !== 'ethereum') return null;

    const output = getOutput(send.outputs, 0);
    const { address, amount } = output;
    const { networkTypeEthereum } = send;
    const { data, gasPrice, gasLimit } = networkTypeEthereum;

    const transaction = prepareEthereumTransaction({
        network: network.symbol,
        token: null,
        from: account.descriptor,
        to: address.value,
        amount: amount.value,
        data: data.value,
        gasLimit: gasLimit.value,
        gasPrice: gasPrice.value,
        nonce: account.misc.nonce,
    });

    console.log('transaction', transaction);

    // // @ts-ignore
    // const response = await TrezorConnect.ethereumSignTransaction({
    //     device: {
    //         path: selectedDevice.path,
    //         instance: selectedDevice.instance,
    //         state: selectedDevice.state,
    //     },
    //     useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
    //     path: account.path,
    //     transaction,
    // });

    // if (response.success) {
    //     dispatch(commonActions.clear());
    //     dispatch(
    //         notificationActions.add({
    //             variant: 'success',
    //             title: `Success: ${response.payload.txid}`,
    //             cancelable: true,
    //         }),
    //     );
    //     dispatch(accountActions.fetchAndUpdateAccount(account));
    // } else {
    //     dispatch(
    //         notificationActions.add({
    //             variant: 'error',
    //             title: `Error: ${resp.payload.error}`,
    //             cancelable: true,
    //         }),
    //     );
    // }
};

/*
    Change value in input "gas price"
 */
export const handleGasPrice = (gasPrice: string) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    const gasLimit = send.networkTypeEthereum.gasLimit.value || '0';
    const fee = calculateEthFee(gasPrice, gasLimit);

    dispatch({
        type: SEND.ETH_HANDLE_GAS_PRICE,
        gasPrice,
    });

    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: gasPrice,
            feeLimit: gasLimit,
            feePerTx: '1',
            blocks: 1,
            value: fee,
        },
    });

    dispatch(composeChange());
};

/*
    Change value in input "gas limit "
 */
export const handleGasLimit = (gasLimit: string) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    const gasPrice = send.networkTypeEthereum.gasPrice.value || '0';
    const fee = calculateEthFee(gasPrice, gasLimit);

    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: gasPrice,
            feeLimit: gasLimit,
            feePerTx: '1',
            blocks: 1,
            value: fee,
        },
    });

    dispatch(composeChange());
};

/*
    Change value in input "Data"
 */
export const handleData = (data: string) => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const { account } = selectedAccount;
    if (!send || !account) return null;

    dispatch({
        type: SEND.ETH_HANDLE_DATA,
        data,
    });

    const newFeeLevels = await TrezorConnect.blockchainEstimateFee({
        coin: 'eth',
        request: {
            blocks: [2],
            specific: {
                from: send.outputs[0].address.value || account.descriptor,
                to: send.outputs[0].address.value || account.descriptor,
                data,
            },
        },
    });

    // @ts-ignore
    const level = newFeeLevels.payload.levels[0];
    const gasLimit = level.feeLimit;
    const gasPrice = ethUnits.convert(level.feePerUnit, 'wei', 'gwei');
    const fee = calculateEthFee(gasPrice, gasLimit);

    // update custom fee
    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: gasPrice,
            feeLimit: gasLimit,
            feePerTx: '1',
            blocks: 1,
            value: fee,
        },
    });

    // update gas limit input
    dispatch({
        type: SEND.ETH_HANDLE_GAS_LIMIT,
        gasLimit,
    });

    // update gas price input
    dispatch({
        type: SEND.ETH_HANDLE_GAS_PRICE,
        gasPrice,
    });
};
