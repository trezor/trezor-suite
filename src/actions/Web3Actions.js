/* @flow */
import Web3 from 'web3';
import HDKey from 'hdkey';
import BigNumber from 'bignumber.js';

import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsUnits from 'ethereumjs-units';
import EthereumjsTx from 'ethereumjs-tx';
import InputDataDecoder from 'ethereum-input-data-decoder';
import TrezorConnect from 'trezor-connect';
import type { EstimateGasOptions, TransactionStatus, TransactionReceipt } from 'web3';
import { strip } from 'utils/ethUtils';
import * as WEB3 from 'actions/constants/web3';
import * as PENDING from 'actions/constants/pendingTx';

import type {
    Dispatch,
    GetState,
    ThunkAction,
    AsyncAction,
    PromiseAction,
    AccountDiscovery,
    EthereumTxRequest,
    EthereumPreparedTx
} from 'flowtype';

import type { EthereumAccount } from 'trezor-connect';
import type { Account } from 'reducers/AccountsReducer';
import type { PendingTx } from 'reducers/PendingTxReducer';
import type { Web3Instance } from 'reducers/Web3Reducer';
import type { Token } from 'reducers/TokensReducer';
import type { NetworkToken } from 'reducers/LocalStorageReducer';
import * as TokenActions from './TokenActions';
import * as AccountsActions from './AccountsActions';

export type Web3UpdateBlockAction = {
    type: typeof WEB3.BLOCK_UPDATED,
    network: string,
    blockHash: string
};

export type Web3UpdateGasPriceAction = {
    type: typeof WEB3.GAS_PRICE_UPDATED,
    network: string,
    gasPrice: string
};

export type Web3Action = {
    type: typeof WEB3.READY,
} | {
    type: typeof WEB3.START,
} | {
    type: typeof WEB3.CREATE | typeof WEB3.DISCONNECT,
    instance: Web3Instance
} | Web3UpdateBlockAction
  | Web3UpdateGasPriceAction;

export const initWeb3 = (network: string, urlIndex: number = 0): PromiseAction<Web3Instance> => async (dispatch: Dispatch, getState: GetState): Promise<Web3Instance> => {
    return new Promise(async (resolve, reject) => {
        // check if requested web was initialized before
        const instance = getState().web3.find(w3 => w3.network === network);
        if (instance && instance.web3.currentProvider.connected) {
            resolve(instance);
            return;
        }

        // requested web3 wasn't initialized or is disconnected
        // initialize again
        const { config, ERC20Abi } = getState().localStorage;
        const coin = config.coins.find(c => c.network === network);
        if (!coin) {
            // coin not found
            reject(new Error(`Network ${ network} not found in application config.`));
            return;
        }

        // get first url
        const url = coin.web3[ urlIndex ];
        if (!url) {
            reject(new Error('Web3 backend is not responding'));
            return;
        }

        const web3 = new Web3( new Web3.providers.WebsocketProvider(url) );

        const onConnect = async () => {

            const latestBlock = await web3.eth.getBlockNumber();
            const gasPrice = await web3.eth.getGasPrice();

            const instance = {
                network,
                web3,
                chainId: coin.chainId,
                erc20: new web3.eth.Contract(ERC20Abi),
                latestBlock,
                gasPrice,
            }

            console.warn("CONNECT", web3)

            dispatch({
                type: WEB3.CREATE,
                instance,
            });

            // await dispatch( _onNewBlock(instance) );

            resolve(instance);
        }

        const onEnd = async () => {

            web3.currentProvider.reset();
            const instance = getState().web3.find(w3 => w3.network === network);

            if (instance && instance.web3.currentProvider.connected) {
                // backend disconnects
                // dispatch({
                //     type: 'WEB3.DISCONNECT',
                //     network
                // });
            } else {
                // backend initialization error for given url, try next one
                try {
                    const web3 = await dispatch( initWeb3(network, urlIndex + 1) );
                    resolve(web3);
                } catch (error) {
                    reject(error);
                }
            }
        }

        web3.currentProvider.on('connect', onConnect);
        web3.currentProvider.on('end', onEnd);
        web3.currentProvider.on('error', onEnd);
    });
}

const _onNewBlock = (instance: Web3Instance): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {

    // const latestBlock = await instance.web3.eth.getBlockNumber();

    // dispatch({
    //     type: WEB3.BLOCK_UPDATED,
    //     network: instance.network,
    //     blockHash: latestBlock,
    // });

    

    // TODO: filter only current device
    const accounts = getState().accounts.filter(a => a.network === instance.network);
    for (const account of accounts) {
        const nonce = await instance.web3.eth.getTransactionCount(account.address);
        if (nonce !== account.nonce) {
            dispatch(AccountsActions.setNonce(account.address, account.network, account.deviceState, nonce));
        }

        const balance = await instance.web3.eth.getBalance(account.address);
        const newBalance = EthereumjsUnits.convert(balance, 'wei', 'ether');
        if (newBalance !== account.balance) {
            dispatch(AccountsActions.setBalance(
                account.address,
                account.network,
                account.deviceState,
                newBalance
            ));
        }
    }

    const tokens = getState().tokens.filter(t => t.network === instance.network);
    for (const token of tokens) {
        const balance = await dispatch( getTokenBalance(token) );
        console.warn("TOK BALAC", balance)
        // const newBalance: string = balance.dividedBy(Math.pow(10, token.decimals)).toString(10);
        if (balance !== token.balance) {
            dispatch(TokenActions.setBalance(
                token.address,
                token.ethAddress,
                balance,
            ));
        }
    }

    // dispatch(getGasPrice(network));

    
}

export const discoverAccount = (address: string, network: string): PromiseAction<AccountDiscovery> => async (dispatch: Dispatch, getState: GetState): Promise<AccountDiscovery> => {
    const instance: Web3Instance = await dispatch( initWeb3(network) );
    const balance = await instance.web3.eth.getBalance(address);
    const nonce = await instance.web3.eth.getTransactionCount(address);
    return { 
        transactions: 0,
        block: 0,
        balance: EthereumjsUnits.convert(balance, 'wei', 'ether'),
        nonce 
    };
}

export const resolvePendingTransactions = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const instance: Web3Instance = await dispatch( initWeb3(network) );
    const pending = getState().pending.filter(p => p.network === network);
    for (const tx of pending) {
        const status = await instance.web3.eth.getTransaction(tx.id);
        if (!status) {
            dispatch({
                type: PENDING.TX_NOT_FOUND,
                tx,
            });
        } else {
            const receipt = await instance.web3.eth.getTransactionReceipt(tx.id);
            if (receipt) {
                if (status.gas !== receipt.gasUsed) {
                    dispatch({
                        type: PENDING.TX_TOKEN_ERROR,
                        tx,
                    });
                }
                dispatch({
                    type: PENDING.TX_RESOLVED,
                    tx,
                    receipt,
                });
            }
        }
    }
}

export const getPendingInfo = (network: string, txid: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const instance: Web3Instance = await dispatch( initWeb3(network) );
    const tx = await instance.web3.eth.getTransaction(txid);

    /*
    if (tx.input !== "0x") {
        // find token:
        // tx.to <= smart contract address

        // smart contract data
        const decoder = new InputDataDecoder(instance.erc20.options.jsonInterface);
        const data = decoder.decodeData(tx.input);
        if (data.name === 'transfer') {
            console.warn("DATA!", data.inputs[0], data.inputs[1].toString(10));
        }
        

    }
    */
    // return tx;
}

export const getTxInput = (): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    
    const instance: Web3Instance = await dispatch( initWeb3("ropsten") );
    console.warn("GETTX", instance.erc20.options.jsonInterface)
    // const inputData = instance.web3.utils.hexToAscii("0xa9059cbb00000000000000000000000073d0385f4d8e00c5e6504c6030f47bf6212736a80000000000000000000000000000000000000000000000000000000000000001");
    // console.warn("input data!", inputData);
}


export const updateAccount = (account: Account, newAccount: EthereumAccount, network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const instance: Web3Instance = await dispatch( initWeb3(network) );
    const balance = await instance.web3.eth.getBalance(account.address);
    const nonce = await instance.web3.eth.getTransactionCount(account.address);
    dispatch( AccountsActions.update( { ...account, ...newAccount, balance: EthereumjsUnits.convert(balance, 'wei', 'ether'), nonce }) );

    // update tokens for this account
    const tokens = getState().tokens.filter(t => t.network === account.network && t.ethAddress === account.address);
    for (const token of tokens) {
        const balance = await dispatch( getTokenBalance(token) );
        // const newBalance: string = balance.dividedBy(Math.pow(10, token.decimals)).toString(10);
        if (balance !== token.balance) {
            dispatch(TokenActions.setBalance(
                token.address,
                token.ethAddress,
                balance,
            ));
        }
    }
}

export const getTokenInfo = (address: string, network: string): PromiseAction<NetworkToken> => async (dispatch: Dispatch, getState: GetState): Promise<NetworkToken> => {
    const instance: Web3Instance = await dispatch( initWeb3(network) );
    const contract = instance.erc20.clone();
    contract.options.address = address;

    const name = await contract.methods.name().call();
    const symbol = await contract.methods.symbol().call();
    const decimals = await contract.methods.decimals().call();

    return {
        address,
        name,
        symbol,
        decimals,
    };
};

export const getTokenBalance = (token: Token): PromiseAction<string> => async (dispatch: Dispatch, getState: GetState): Promise<string> => {
    const instance = await dispatch( initWeb3(token.network) );
    const contract = instance.erc20.clone();
    contract.options.address = token.address;

    const balance = await contract.methods.balanceOf(token.ethAddress).call();
    return new BigNumber(balance).dividedBy(Math.pow(10, token.decimals)).toString(10);
};

export const getCurrentGasPrice = (network: string): PromiseAction<string> => async (dispatch: Dispatch, getState: GetState): Promise<string> => {
    const instance = getState().web3.find(w3 => w3.network === network);
    if (instance) {
        return EthereumjsUnits.convert(instance.gasPrice, 'wei', 'gwei');
    } else {
        return "0";
    }

    // const index: number = getState().web3.findIndex(w3 => w3.network === network);

    // const web3instance = getState().web3[index];
    // const web3 = web3instance.web3;
    // web3.eth.getGasPrice((error, gasPrice) => {
    //     if (!error) {
    //         if (web3instance.gasPrice && web3instance.gasPrice.toString() !== gasPrice.toString()) {
    //             dispatch({
    //                 type: WEB3.GAS_PRICE_UPDATED,
    //                 network,
    //                 gasPrice,
    //             });
    //         }
    //     }
    // });
}


export const estimateGasLimit = (network: string, options: EstimateGasOptions): PromiseAction<number> => async (dispatch: Dispatch, getState: GetState): Promise<number> => {
    const instance = await dispatch( initWeb3(network) );
    // TODO: allow data starting with 0x ...
    options.to = '0x0000000000000000000000000000000000000000';
    options.data = `0x${options.data.length % 2 === 0 ? options.data : `0${options.data}`}`;
    options.value = instance.web3.utils.toHex( EthereumjsUnits.convert(options.value || '0', 'ether', 'wei') );
    options.gasPrice = instance.web3.utils.toHex( EthereumjsUnits.convert(options.gasPrice, 'gwei', 'wei') );

    const limit = await instance.web3.eth.estimateGas(options);
    return limit;
};

export const disconnect = (network: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    // check if Web3 was already initialized
    const instance = getState().web3.find(w3 => w3.network === network);
    if (instance) {
        // reset current connection
        instance.web3.currentProvider.reset();
        instance.web3.currentProvider.connection.close();
        
        // remove instance from reducer
        dispatch({
            type: WEB3.DISCONNECT,
            instance
        });
    }
};
