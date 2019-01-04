/* @flow */

import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as PENDING from 'actions/constants/pendingTx';

import type {
    TrezorDevice,
    Dispatch,
    GetState,
    PromiseAction,
} from 'flowtype';
import type { EthereumAccount, BlockchainNotification } from 'trezor-connect';
import type { Token } from 'reducers/TokensReducer';
import type { NetworkToken } from 'reducers/LocalStorageReducer';
import * as Web3Actions from 'actions/Web3Actions';
import * as AccountsActions from 'actions/AccountsActions';

export const discoverAccount = (device: TrezorDevice, descriptor: string, network: string): PromiseAction<EthereumAccount> => async (dispatch: Dispatch): Promise<EthereumAccount> => {
    // get data from connect
    const txs = await TrezorConnect.ethereumGetAccountInfo({
        account: {
            descriptor,
            block: 0,
            transactions: 0,
            balance: '0',
            availableBalance: '0',
            nonce: 0,
        },
        coin: network,
    });

    if (!txs.success) {
        throw new Error(txs.payload.error);
    }

    // blockbook web3 fallback
    const web3account = await dispatch(Web3Actions.discoverAccount(descriptor, network));
    return {
        descriptor,
        transactions: txs.payload.transactions,
        block: txs.payload.block,
        balance: web3account.balance,
        availableBalance: web3account.balance,
        nonce: web3account.nonce,
    };
};

export const getTokenInfo = (input: string, network: string): PromiseAction<NetworkToken> => async (dispatch: Dispatch): Promise<NetworkToken> => dispatch(Web3Actions.getTokenInfo(input, network));

export const getTokenBalance = (token: Token): PromiseAction<string> => async (dispatch: Dispatch): Promise<string> => dispatch(Web3Actions.getTokenBalance(token));

export const getGasPrice = (network: string, defaultGasPrice: number): PromiseAction<BigNumber> => async (dispatch: Dispatch): Promise<BigNumber> => {
    try {
        const gasPrice = await dispatch(Web3Actions.getCurrentGasPrice(network));
        return gasPrice === '0' ? new BigNumber(defaultGasPrice) : new BigNumber(gasPrice);
    } catch (error) {
        return new BigNumber(defaultGasPrice);
    }
};

const estimateProxy: Array<Promise<string>> = [];
export const estimateGasLimit = (network: string, data: string, value: string, gasPrice: string): PromiseAction<string> => async (dispatch: Dispatch): Promise<string> => {
    // Since this method could be called multiple times in short period of time
    // check for pending calls in proxy and if there more than two (first is current running and the second is waiting for result of first)
    // TODO: should reject second call immediately?
    if (estimateProxy.length > 0) {
        // wait for proxy result (but do not process it)
        await estimateProxy[0];
    }

    const call = dispatch(Web3Actions.estimateGasLimit(network, {
        to: '',
        data,
        value,
        gasPrice,
    }));
    // add current call to proxy
    estimateProxy.push(call);
    // wait for result
    const result = await call;
    // remove current call from proxy
    estimateProxy.splice(0, 1);
    // return result
    return result;
};

export const subscribe = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const accounts: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.descriptor); // eslint-disable-line no-unused-vars
    const response = await TrezorConnect.blockchainSubscribe({
        accounts,
        coin: network,
    });
    if (!response.success) return;
    // init web3 instance if not exists
    await dispatch(Web3Actions.initWeb3(network));
};

export const onBlockMined = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // TODO: handle rollback,
    // check latest saved transaction blockhash against blockhheight

    // try to resolve pending transactions
    await dispatch(Web3Actions.resolvePendingTransactions(network));

    await dispatch(Web3Actions.updateGasPrice(network));

    const accounts: Array<any> = getState().accounts.filter(a => a.network === network);
    if (accounts.length > 0) {
        // find out which account changed
        const response = await TrezorConnect.ethereumGetAccountInfo({
            accounts,
            coin: network,
        });

        if (response.success) {
            response.payload.forEach((a, i) => {
                if (a.transactions > 0) {
                    // load additional data from Web3 (balance, nonce, tokens)
                    dispatch(Web3Actions.updateAccount(accounts[i], a, network));
                } else {
                    // there are no new txs, just update block
                    dispatch(AccountsActions.update({ ...accounts[i], block: a.block }));

                    // HACK: since blockbook can't work with smart contracts for now
                    // try to update tokens balances added to this account using Web3
                    dispatch(Web3Actions.updateAccountTokens(accounts[i]));
                }
            });
        }
    }
};

export const onNotification = (payload: $ElementType<BlockchainNotification, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { notification } = payload;
    const account = getState().accounts.find(a => a.descriptor === notification.descriptor);
    if (!account) return;

    if (!notification.blockHeight) {
        dispatch({
            type: PENDING.ADD,
            payload: {
                ...notification,
                deviceState: account.deviceState,
                network: account.network,
            },
        });
    }
};

export const onError = (network: string): PromiseAction<void> => async (dispatch: Dispatch): Promise<void> => {
    dispatch(Web3Actions.disconnect(network));
};
