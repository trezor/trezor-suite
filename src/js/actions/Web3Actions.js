/* @flow */


import Web3 from 'web3';
import HDKey from 'hdkey';

import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import type { ContractFactory, EstimateGasOptions } from 'web3';
import type BigNumber from 'bignumber.js';
import type { TransactionStatus, TransactionReceipt } from 'web3';
import { strip } from '../utils/ethUtils';
import * as WEB3 from './constants/web3';
import * as PENDING from './constants/pendingTx';
import * as AccountsActions from './AccountsActions';
import * as TokenActions from './TokenActions';

import type {
    Dispatch,
    GetState,
    Action,
    AsyncAction,
} from '~/flowtype';

import type { Account } from '../reducers/AccountsReducer';
import type { PendingTx } from '../reducers/PendingTxReducer';
import type { Web3Instance } from '../reducers/Web3Reducer';
import type { Token } from '../reducers/TokensReducer';
import type { NetworkToken } from '../reducers/LocalStorageReducer';

export type Web3Action = {
    type: typeof WEB3.READY,
} | {
    type: typeof WEB3.CREATE,
    instance: Web3Instance
}
  | Web3UpdateBlockAction
  | Web3UpdateGasPriceAction;

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


export function init(instance: ?Web3, coinIndex: number = 0): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const { config, ERC20Abi } = getState().localStorage;

        const coin = config.coins[coinIndex];
        if (!coin) {
            // all instances done
            dispatch({
                type: WEB3.READY,
            });
            return;
        }

        const network = coin.network;
        const urls = coin.backends[0].urls;

        let web3host: string = urls[0];

        if (instance) {
            const currentHost = instance.currentProvider.host;
            const currentHostIndex: number = urls.indexOf(currentHost);

            if (currentHostIndex + 1 < urls.length) {
                web3host = urls[currentHostIndex + 1];
            } else {
                console.error(`TODO: Backend ${network} not working`, instance.currentProvider);

                dispatch({
                    type: WEB3.CREATE,
                    instance: {
                        network,
                        web3: instance,
                        chainId: coin.chainId,
                        erc20: instance.eth.contract(ERC20Abi),
                        latestBlock: '0',
                        gasPrice: '0',
                    },
                });

                // try next coin
                dispatch(init(null, coinIndex + 1));
                return;
            }
        }

        //const instance = new Web3(window.web3.currentProvider);
        const web3 = new Web3(new Web3.providers.HttpProvider(web3host));

        // instance = new Web3( new Web3.providers.HttpProvider('https://pyrus2.ubiqscan.io') ); // UBQ
        //instance = new Web3( new Web3.providers.HttpProvider('https://node.expanse.tech/') ); // EXP
        //instance = new Web3( new Web3.providers.HttpProvider('http://10.34.0.91:8545/') );

        //web3 = new Web3(new Web3.providers.HttpProvider("https://api.myetherapi.com/rop"));
        //instance = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io2/QGyVKozSUEh2YhL4s2G4"));
        //web3 = new Web3( new Web3.providers.HttpProvider("ws://34.230.234.51:30303") );


        // initial check if backend is running
        if (!web3.currentProvider.isConnected()) {
            // try different url
            dispatch(init(web3, coinIndex));
            return;
        }

        const erc20 = web3.eth.contract(ERC20Abi);

        dispatch({
            type: WEB3.CREATE,
            instance: {
                network,
                web3,
                chainId: coin.chainId,
                erc20,
                latestBlock: '0',
                gasPrice: '0',
            },
        });

        // dispatch({
        //     type: WEB3.GAS_PRICE_UPDATED,
        //     network,
        //     gasPrice
        // });


        // console.log("GET CHAIN", instance.version.network)

        // instance.version.getWhisper((err, shh) => {
        //     console.log("-----whisperrr", error, shh)
        // })


        // const sshFilter = instance.ssh.filter('latest');
        // sshFilter.watch((error, blockHash) => {
        //     console.warn("SSH", error, blockHash);
        // });

        //const shh = instance.shh.newIdentity();

        const latestBlockFilter = web3.eth.filter('latest');

        const onBlockMined = async (error: ?Error, blockHash: ?string) => {
            if (error) {
                window.setTimeout(() => {
                    // try again
                    onBlockMined(new Error('manually_triggered_error'), undefined);
                }, 30000);
            }

            if (blockHash) {
                dispatch({
                    type: WEB3.BLOCK_UPDATED,
                    network,
                    blockHash,
                });
            }

            // TODO: filter only current device
            const accounts = getState().accounts.filter(a => a.network === network);
            for (const account of accounts) {
                const nonce = await getNonceAsync(web3, account.address);
                if (nonce !== account.nonce) {
                    dispatch(AccountsActions.setNonce(account.address, account.network, account.deviceState, nonce));

                    // dispatch( getBalance(account) );
                    // TODO: check if nonce was updated,
                    // update tokens balance,
                    // update account balance,
                    // update pending transactions
                }
                dispatch(getBalance(account));
                // dispatch( getNonce(account) );
            }

            const tokens = getState().tokens.filter(t => t.network === network);
            for (const token of tokens) {
                dispatch(getTokenBalance(token));
            }

            dispatch(getGasPrice(network));

            const pending = getState().pending.filter(p => p.network === network);
            for (const tx of pending) {
                dispatch(getTransactionReceipt(tx));
            }
        };

        // latestBlockFilter.watch(onBlockMined);
        onBlockMined(new Error('manually_triggered_error'), undefined);


        // init next coin
        dispatch(init(web3, coinIndex + 1));


        // let instance2 = new Web3( new Web3.providers.HttpProvider('https://pyrus2.ubiqscan.io') );
        // console.log("INIT WEB3", instance, instance2);
        // instance2.eth.getGasPrice((error, gasPrice) => {
        //     console.log("---gasss price from UBQ", gasPrice)
        // });
    };
}


export function getGasPrice(network: string): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const index: number = getState().web3.findIndex(w3 => w3.network === network);

        const web3instance = getState().web3[index];
        const web3 = web3instance.web3;
        web3.eth.getGasPrice((error, gasPrice) => {
            if (!error) {
                if (web3instance.gasPrice && web3instance.gasPrice.toString() !== gasPrice.toString()) {
                    dispatch({
                        type: WEB3.GAS_PRICE_UPDATED,
                        network,
                        gasPrice,
                    });
                }
            }
        });
    };
}

export function getBalance(account: Account): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const web3instance = getState().web3.filter(w3 => w3.network === account.network)[0];
        const web3: Web3 = web3instance.web3;

        web3.eth.getBalance(account.address, (error: Error, balance: BigNumber) => {
            if (!error) {
                const newBalance: string = web3.fromWei(balance.toString(), 'ether');
                if (account.balance !== newBalance) {
                    dispatch(AccountsActions.setBalance(
                        account.address,
                        account.network,
                        account.deviceState,
                        newBalance,
                    ));

                    // dispatch( loadHistory(addr) );
                }
            }
        });
    };
}

export function getTokenBalance(token: Token): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const web3instance = getState().web3.filter(w3 => w3.network === token.network)[0];
        const web3 = web3instance.web3;
        const contract = web3instance.erc20.at(token.address);

        contract.balanceOf(token.ethAddress, (error: Error, balance: BigNumber) => {
            if (balance) {
                const newBalance: string = balance.dividedBy(Math.pow(10, token.decimals)).toString(10);
                if (newBalance !== token.balance) {
                    dispatch(TokenActions.setBalance(
                        token.address,
                        token.ethAddress,
                        newBalance,
                    ));
                }
            }
        });
    };
}

export function getNonce(account: Account): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const web3instance = getState().web3.filter(w3 => w3.network === account.network)[0];
        const web3 = web3instance.web3;

        web3.eth.getTransactionCount(account.address, (error: Error, result: number) => {
            if (!error) {
                if (account.nonce !== result) {
                    dispatch(AccountsActions.setNonce(account.address, account.network, account.deviceState, result));
                }
            }
        });
    };
}

export const getTransactionReceipt = (tx: PendingTx): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const web3instance = getState().web3.filter(w3 => w3.network === tx.network)[0];
    const web3 = web3instance.web3;

    web3.eth.getTransaction(tx.id, (error: Error, status: TransactionStatus) => {
        if (!error && !status) {
            dispatch({
                type: PENDING.TX_NOT_FOUND,
                tx,
            });
        } else if (status && status.blockNumber) {
            web3.eth.getTransactionReceipt(tx.id, (error: Error, receipt: TransactionReceipt) => {
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
            });
        }
    });
};

export const getTransaction = (web3: Web3, txid: string): Promise<any> => new Promise((resolve, reject) => {
    web3.eth.getTransaction(txid, (error, result) => {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    });
});

export const getBalanceAsync = (web3: Web3, address: string): Promise<BigNumber> => new Promise((resolve, reject) => {
    web3.eth.getBalance(address, (error: Error, result: BigNumber) => {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    });
});

export const getTokenBalanceAsync = (erc20: ContractFactory, token: Token): Promise<string> => new Promise((resolve, reject) => {
    const contract = erc20.at(token.address);
    contract.balanceOf(token.ethAddress, (error: Error, balance: BigNumber) => {
        if (error) {
            reject(error);
        } else {
            const newBalance: string = balance.dividedBy(Math.pow(10, token.decimals)).toString(10);
            resolve(newBalance);
        }
    });
});

export const getNonceAsync = (web3: Web3, address: string): Promise<number> => new Promise((resolve, reject) => {
    web3.eth.getTransactionCount(address, (error: Error, result: number) => {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    });
});


export const getTokenInfoAsync = (erc20: ContractFactory, address: string): Promise<?NetworkToken> => new Promise((resolve, reject) => {
    const contract = erc20.at(address, (error, res) => {
        // console.warn("callback", error, res)
    });

    const info: NetworkToken = {
        address,
        name: '',
        symbol: '',
        decimals: 0,
    };

    contract.name.call((error: Error, name: string) => {
        if (error) {
            resolve(null);
            return;
        }
        info.name = name;


        contract.symbol.call((error: Error, symbol: string) => {
            if (error) {
                resolve(null);
                return;
            }
            info.symbol = symbol;


            contract.decimals.call((error: Error, decimals: BigNumber) => {
                if (decimals) {
                    info.decimals = decimals.toNumber();
                    resolve(info);
                } else {
                    resolve(null);
                }
            });
        });
    });
});

export const estimateGas = (web3: Web3, options: EstimateGasOptions): Promise<number> => new Promise((resolve, reject) => {
    web3.eth.estimateGas(options, (error: ?Error, gas: ?number) => {
        if (error) {
            reject(error);
        } else if (typeof gas === 'number') {
            resolve(gas);
        }
    });
});

export const pushTx = (web3: Web3, tx: any): Promise<string> => new Promise((resolve, reject) => {
    web3.eth.sendRawTransaction(tx, (error: Error, result: string) => {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    });
});