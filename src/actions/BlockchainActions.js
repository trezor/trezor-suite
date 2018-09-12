/* @flow */

import Web3 from 'web3';
import HDKey from 'hdkey';

import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsUnits from 'ethereumjs-units';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';

import type { EstimateGasOptions } from 'web3';
import type { TransactionStatus, TransactionReceipt } from 'web3';
import { strip } from 'utils/ethUtils';
import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as WEB3 from 'actions/constants/web3';
import * as PENDING from 'actions/constants/pendingTx';

import * as Web3Actions from './Web3Actions';

import type {
    TrezorDevice,
    Dispatch,
    GetState,
    Action,
    AsyncAction,
    PromiseAction,
    ThunkAction,
    AccountDiscovery,
    EthereumTxRequest
} from 'flowtype';

import type { Token } from 'reducers/TokensReducer';
import type { NetworkToken } from 'reducers/LocalStorageReducer';

export type BlockchainAction = {
    type: typeof BLOCKCHAIN.START | typeof BLOCKCHAIN.CONNECTING,
    network: string,
} | {
    type: typeof BLOCKCHAIN.STOP,
    network: string,
};

export const discoverAccount = (device: TrezorDevice, xpub: string, network: string): PromiseAction<AccountDiscovery> => async (dispatch: Dispatch, getState: GetState): Promise<AccountDiscovery> => {
    // get data from connect
    // Temporary disabled, enable after trezor-connect@5.0.32 release
    const txs = await TrezorConnect.ethereumGetAccountInfo({
        account: {
            address: xpub,
            // block: 3984156,
            block: 0,
            transactions: 0
        },
        coin: network,
    });

    if (!txs.success) {
        throw new Error(txs.payload.error);
    }

    // blockbook web3 fallback
    const web3account = await dispatch( Web3Actions.discoverAccount(xpub, network) );
    // return { transactions: txs.payload, ...web3account };
    return { 
        transactions: txs.payload.transactions,
        block: txs.payload.block,
        balance: web3account.balance,
        nonce: web3account.nonce,
    };
};

export const getTokenInfo = (input: string, network: string): PromiseAction<NetworkToken> => async (dispatch: Dispatch, getState: GetState): Promise<NetworkToken> => {
    return await dispatch( Web3Actions.getTokenInfo(input, network) );
}

export const getTokenBalance = (token: Token): PromiseAction<string> => async (dispatch: Dispatch, getState: GetState): Promise<string> => {
    return await dispatch( Web3Actions.getTokenBalance(token) );
}

export const getGasPrice = (network: string, defaultGasPrice: number): PromiseAction<BigNumber> => async (dispatch: Dispatch, getState: GetState): Promise<BigNumber> => {
    try {
        const gasPrice = await dispatch( Web3Actions.getCurrentGasPrice(network) );
        return new BigNumber(gasPrice);
    } catch (error) {
        return new BigNumber(defaultGasPrice);
    }
}

export const estimateGasLimit = (network: string, data: string, value: string, gasPrice: string): PromiseAction<number> => async (dispatch: Dispatch, getState: GetState): Promise<number> => {
    return await dispatch( Web3Actions.estimateGasLimit(network, { to: '', data, value, gasPrice }) );
}

export const onBlockMined = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {

    // try to resolve pending transactions
    // await dispatch( Web3Actions.resolvePendingTransactions(network) );

    // get network accounts
    // const accounts: Array<any> = getState().accounts.filter(a => a.network === network).map(a => {
    //     return {
    //         address: a.address,
    //         block: a.block,
    //         transactions: a.transactions
    //     }
    // });
    const accounts: Array<any> = getState().accounts.filter(a => a.network === network);
    
    // find out which account changed
    const response = await TrezorConnect.ethereumGetAccountInfo({
        accounts,
        coin: network,
    });

    if (!response.success) {

    } else {
        response.payload.forEach((a, i) => {
            if (a.transactions > 0) {
                dispatch( Web3Actions.updateAccount(accounts[i], a, network) )
            }
        });
    }

    //return await dispatch( Web3Actions.estimateGasLimit(network, { to: '', data, value, gasPrice }) );
    console.warn("onBlockMined", response)
}

export const onNotification = (payload: any): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {

    // this event can be triggered multiple times
    // 1. check if pair [txid + address] is already in reducer
    const address: string = EthereumjsUtil.toChecksumAddress(payload.tx.address);
    const txInfo = await dispatch( Web3Actions.getPendingInfo(payload.coin, payload.tx.txid) );

    // const exists = getState().pending.filter(p => p.id === payload.tx.txid && p.address === address);
    const exists = getState().pending.filter(p => {
        console.warn("CHECK", p.address === address, p.id === payload.tx.txid, p)
        return p.address === address;
    });
    if (exists.length < 1) {
        
        console.warn("TXINFO!", txInfo);
        if (txInfo) {
            dispatch({
                type: PENDING.ADD,
                payload: {
                    id: payload.tx.txid,
                    network: payload.coin,
                    currency: "tETH",
                    amount: txInfo.value,
                    total: "0",
                    tx: {},
                    nonce: txInfo.nonce,
                    address,
                }
            });
        } else {
            // tx info not found (yet?)
            // dispatch({
            //     type: PENDING.ADD_UNKNOWN,
            //     payload: {
            //         network: payload.coin,
            //         ...payload.tx,
            //     }
            // });
        }
    }

    console.warn("WEB3", payload, exists, getState().pending, address)
}


export const subscribe = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const addresses: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.address);
    // $FlowIssue: trezor-connect@5.0.32
    return await TrezorConnect.blockchainSubscribe({
        // accounts: addresses,
        accounts: [],
        coin: network
    });
}