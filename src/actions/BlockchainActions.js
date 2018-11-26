/* @flow */

import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as BLOCKCHAIN from 'actions/constants/blockchain';

import type {
    TrezorDevice,
    Dispatch,
    GetState,
    PromiseAction,
} from 'flowtype';
import type { EthereumAccount } from 'trezor-connect';
import type { Token } from 'reducers/TokensReducer';
import type { NetworkToken } from 'reducers/LocalStorageReducer';
import * as Web3Actions from './Web3Actions';
import * as AccountsActions from './AccountsActions';

export type BlockchainAction = {
    type: typeof BLOCKCHAIN.READY,
}

export const discoverAccount = (device: TrezorDevice, address: string, network: string): PromiseAction<EthereumAccount> => async (dispatch: Dispatch): Promise<EthereumAccount> => {
    // get data from connect
    // Temporary disabled, enable after trezor-connect@5.0.32 release
    const txs = await TrezorConnect.ethereumGetAccountInfo({
        account: {
            address,
            block: 0,
            transactions: 0,
            balance: '0',
            nonce: 0,
        },
        coin: network,
    });

    if (!txs.success) {
        throw new Error(txs.payload.error);
    }

    // blockbook web3 fallback
    const web3account = await dispatch(Web3Actions.discoverAccount(address, network));
    // return { transactions: txs.payload, ...web3account };
    return {
        address,
        transactions: txs.payload.transactions,
        block: txs.payload.block,
        balance: web3account.balance,
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

export const onBlockMined = (coinInfo: any): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // incoming "coinInfo" from TrezorConnect is CoinInfo | EthereumNetwork type
    const network: string = coinInfo.shortcut.toLowerCase();

    if (network !== 'ethereum') return;
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


// not used for now, waiting for fix in blockbook
/*
export const onNotification = (payload: any): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // this event can be triggered multiple times
    // 1. check if pair [txid + address] is already in reducer
    const network: string = payload.coin.shortcut.toLowerCase();
    const address: string = EthereumjsUtil.toChecksumAddress(payload.tx.address);
    const txInfo = await dispatch(Web3Actions.getPendingInfo(network, payload.tx.txid));

    // const exists = getState().pending.filter(p => p.id === payload.tx.txid && p.address === address);
    const exists = getState().pending.filter(p => p.address === address);
    if (exists.length < 1) {
        if (txInfo) {
            dispatch({
                type: PENDING.ADD,
                payload: {
                    type: 'send',
                    id: payload.tx.txid,
                    network,
                    currency: 'tETH',
                    amount: txInfo.value,
                    total: '0',
                    tx: {},
                    nonce: txInfo.nonce,
                    address,
                    rejected: false,
                },
            });
        } else {
            // tx info not found (yet?)
            // dispatch({
            //     type: PENDING.ADD_UNKNOWN,
            //     payload: {
            //         network,
            //         ...payload.tx,
            //     }
            // });
        }
    }
};
*/


export const subscribe = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const addresses: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.address); // eslint-disable-line no-unused-vars
    await TrezorConnect.blockchainSubscribe({
        // accounts: addresses,
        accounts: [],
        coin: network,
    });

    if (network === 'ethereum') {
        // init web3 instance if not exists
        await dispatch(Web3Actions.initWeb3(network));
    }
};

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks
export const init = (): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    if (getState().discovery.length > 0) {
        // get unique networks
        const networks: Array<string> = [];
        getState().discovery.forEach((discovery) => {
            if (networks.indexOf(discovery.network) < 0) {
                networks.push(discovery.network);
            }
        });

        // subscribe
        const results = networks.map(n => dispatch(subscribe(n)));
        // wait for all subscriptions
        await Promise.all(results);
    }

    // continue wallet initialization
    dispatch({
        type: BLOCKCHAIN.READY,
    });
};

// Handle BLOCKCHAIN.ERROR event from TrezorConnect
// disconnect and remove Web3 webscocket instance if exists
export const error = (payload: any): PromiseAction<void> => async (dispatch: Dispatch): Promise<void> => {
    dispatch(Web3Actions.disconnect(payload.coin));
};