import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import * as commonActions from './sendFormCommonActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { toWei, fromWei } from 'web3-utils';
import {
    prepareEthereumTransaction,
    serializeEthereumTx,
    calculateEthFee,
    calculateMax,
    calculateTotal,
    getOutput,
} from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
import TrezorConnect from 'trezor-connect';
import { composeChange } from './sendFormActions';

/*
    Compose eth transaction
 */
export const compose = () => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded' || !send) return null;
    const { account } = selectedAccount;

    let tx;
    const output = getOutput(send.outputs, 0);
    const amountInSatoshi = networkAmountToSatoshi(output.amount.value, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = calculateEthFee(
        toWei(send.selectedFee.feePerUnit, 'gwei'),
        send.selectedFee.feeLimit || '0',
    );
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        feePerUnit: send.selectedFee.feePerUnit,
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
    if (account.networkType !== 'ethereum' || !network.chainId) return null;

    const output = getOutput(send.outputs, 0);
    const { address, amount } = output;
    const { networkTypeEthereum } = send;
    const { data, gasPrice, gasLimit } = networkTypeEthereum;

    const transaction = prepareEthereumTransaction({
        network: network.symbol,
        chainId: network.chainId,
        from: account.descriptor,
        to: address.value,
        amount: amount.value,
        data: data.value,
        gasLimit: gasLimit.value,
        gasPrice: gasPrice.value,
        nonce: account.misc.nonce,
    });
    // TODO: @Vladimir
    // use import { EthereumTransaction } from 'trezor-connect'; instead of EthPreparedTransaction
    // @ts-ignore
    const signedTx = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        path: account.path,
        transaction,
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: signedTx.payload.error }),
        );
        return;
    }

    transaction.r = signedTx.payload.r;
    transaction.s = signedTx.payload.s;
    transaction.v = signedTx.payload.v;

    const serializedTx = serializeEthereumTx(transaction);

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: serializedTx,
        coin: network.symbol,
    });

    if (sentTx.success) {
        dispatch(commonActions.clear());
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-success', txid: sentTx.payload.txid }),
        );
        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }
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

    dispatch({
        type: SEND.ETH_HANDLE_GAS_LIMIT,
        gasLimit,
    });

    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: gasPrice,
            feeLimit: gasLimit,
            feePerTx: '1',
            blocks: 1,
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

    if (!newFeeLevels.success) return null;

    const level = newFeeLevels.payload.levels[0];
    const gasLimit = level.feeLimit || '0'; // TODO: default
    const gasPrice = fromWei(level.feePerUnit, 'gwei');

    // update custom fee
    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            label: 'custom',
            feePerUnit: gasPrice,
            feeLimit: gasLimit,
            feePerTx: '1',
            blocks: 1,
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
