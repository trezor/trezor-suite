/* @flow */
'use strict';

import Web3 from 'web3';
import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import { strip } from '../utils/ethUtils';
import * as ADDRESS from './constants/address';
import * as WEB3 from './constants/web3';
import * as PENDING from './constants/pendingTx';
import * as AddressActions from '../actions/AddressActions';

import type { 
    Dispatch,
    GetState,
    Action,
    AsyncAction,
} from '../flowtype';
import type { ContractFactory } from 'web3';

import type { Account } from '../reducers/AccountsReducer';
import type { PendingTx } from '../reducers/PendingTxReducer';
import type { Web3Instance } from '../reducers/Web3Reducer';

export type Web3Action = {
    type: typeof WEB3.READY,
} | Web3CreateAction
  | Web3UpdateBlockAction
  | Web3UpdateGasPriceAction;

export type Web3CreateAction = {
    type: typeof WEB3.CREATE,
    network: string,
    web3: Web3,
    erc20: ContractFactory,
    chainId: string;
};

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


export function init(web3: ?Web3, coinIndex: number = 0): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const { config, ERC20Abi } = getState().localStorage;

        const coin = config.coins[ coinIndex ];
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

        if (web3) {
            const currentHost = web3.currentProvider.host;
            let currentHostIndex: number = urls.indexOf(currentHost);

            if (currentHostIndex + 1 < urls.length) {
                web3host = urls[currentHostIndex + 1];
            } else {
                console.error("TODO: Backend " + network + " not working", web3.currentProvider );

                dispatch({
                    type: WEB3.CREATE,
                    network,
                    web3,
                    erc20: web3.eth.contract(ERC20Abi),
                    chainId: '0'
                });

                // try next coin
                dispatch( init(null, coinIndex + 1) );
                return;
            }
        }

        //const instance = new Web3(window.web3.currentProvider);
        const instance = new Web3( new Web3.providers.HttpProvider(web3host) );

        // instance = new Web3( new Web3.providers.HttpProvider('https://pyrus2.ubiqscan.io') ); // UBQ
        //instance = new Web3( new Web3.providers.HttpProvider('https://node.expanse.tech/') ); // EXP
        //instance = new Web3( new Web3.providers.HttpProvider('http://10.34.0.91:8545/') );

        //web3 = new Web3(new Web3.providers.HttpProvider("https://api.myetherapi.com/rop"));
        //instance = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io2/QGyVKozSUEh2YhL4s2G4"));
        //web3 = new Web3( new Web3.providers.HttpProvider("ws://34.230.234.51:30303") );

        // initial check if backend is running
        
        instance.eth.getGasPrice((error: Error, gasPrice: string) => {
            if (error) {
                // try different url
                dispatch( init(instance, coinIndex) );
            } else {

                const erc20 = instance.eth.contract(ERC20Abi);

                dispatch({
                    type: WEB3.CREATE,
                    network,
                    web3: instance,
                    erc20,
                    chainId: instance.version.network
                });

                dispatch({
                    type: WEB3.GAS_PRICE_UPDATED,
                    network,
                    gasPrice
                });

                


                // console.log("GET CHAIN", instance.version.network)

                // instance.version.getWhisper((err, shh) => {
                //     console.log("-----whisperrr", error, shh)
                // })
                

                // const sshFilter = instance.ssh.filter('latest');
                // sshFilter.watch((error, blockHash) => {
                //     console.warn("SSH", error, blockHash);
                // });

                //const shh = instance.shh.newIdentity();

                const latestBlockFilter = instance.eth.filter('latest');

                const onBlockMined = async (error: ?Error, blockHash: ?string) => {
                    if (error) {

                        window.setTimeout(() => {
                            // try again
                            onBlockMined(new Error("manually_triggered_error"), undefined);
                        }, 30000);
                    }

                    if (blockHash) {
                        dispatch({
                            type: WEB3.BLOCK_UPDATED,
                            network,
                            blockHash
                        });
                    }

                    // TODO: filter only current device
                    const accounts = getState().accounts.filter(a => a.network === network);
                    for (const addr of accounts) {
                        dispatch( getBalance(addr) );
                        dispatch( getNonce(addr) );
                    }

                    dispatch( getGasPrice(network) );

                    const pending = getState().pending.filter(p => p.network === network);
                    for (const tx of pending) {
                        dispatch( getTransactionReceipt(tx) );
                    }

                }

                latestBlockFilter.watch(onBlockMined);


                // init next coin
                dispatch( init(instance, coinIndex + 1) );

            }
        });

        // let instance2 = new Web3( new Web3.providers.HttpProvider('https://pyrus2.ubiqscan.io') );
        // console.log("INIT WEB3", instance, instance2);
        // instance2.eth.getGasPrice((error, gasPrice) => {
        //     console.log("---gasss price from UBQ", gasPrice)
        // });
    }
}


// export function initContracts(): AsyncAction {
//     return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
//         const { web3, abi, tokens } = getState().web3;

//         const contracts = [];
//         for (let token of tokens) {
//             contracts.push({
//                 contract: web3.eth.contract(abi).at(token.address),
//                 name: token.name,
//                 symbol: token.symbol,
//                 decimal: token.decimal
//             });

//             // web3.eth.contract(abi).at(token.address).balanceOf('0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad', (e, r) => {
//             //     console.warn('contrR', e, r.toString(10));
//             // });
//         }

//         const contract = web3.eth.contract(abi).at('0x58cda554935e4a1f2acbe15f8757400af275e084');

//         contract.name.call((error, name) => {
//             if (error) {
//                 // TODO: skip
//             }
//             contract.symbol.call((error, symbol) => {
//                 if (error) {
//                     // TODO: skip
//                 }

//                 contract.decimals.call((error, decimals) => {
//                 })
//             });
            
            
//         })
//     }
// }


export function getGasPrice(network: string): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const index: number = getState().web3.findIndex(w3 => w3.network === network);

        const web3instance = getState().web3[ index ];
        const web3 = web3instance.web3;
        web3.eth.getGasPrice((error, gasPrice) => {
            if (!error) {
                if (web3instance.gasPrice && web3instance.gasPrice.toString() !== gasPrice.toString()) {
                    dispatch({
                        type: WEB3.GAS_PRICE_UPDATED,
                        network: network,
                        gasPrice
                    });
                }
            }
        });
    }
}

export function getBalance(account: Account): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const web3instance = getState().web3.filter(w3 => w3.network === account.network)[0];
        const web3: Web3 = web3instance.web3;

        web3.eth.getBalance(account.address, (error, balance) => {
            if (!error) {
                const newBalance: string = web3.fromWei(balance.toString(), 'ether');
                if (account.balance !== newBalance) {
                    dispatch(AddressActions.setBalance(
                        account.address,
                        account.network,
                        newBalance
                    ));

                    // dispatch( loadHistory(addr) );
                }
            }
        });
    }
}

export function getNonce(account: Account): AsyncAction {

    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const web3instance = getState().web3.filter(w3 => w3.network === account.network)[0];
        const web3 = web3instance.web3;

        web3.eth.getTransactionCount(account.address, (error: Error, result: number) => {
            if (!error) {
                if (account.nonce !== result) {
                    dispatch({
                        type: ADDRESS.SET_NONCE,
                        address: account.address,
                        network: account.network,
                        nonce: result
                    });
                }
            }
        });
    }
}

export const getTransactionReceipt = (tx: PendingTx): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const web3instance = getState().web3.filter(w3 => w3.network === tx.network)[0];
        const web3 = web3instance.web3;

        //web3.eth.getTransactionReceipt(txid, (error, tx) => {
        web3.eth.getTransaction(tx.id, (error, receipt) => {
            if (receipt && receipt.blockNumber) {
                web3.eth.getBlock(receipt.blockHash, (error, block) => {
                    dispatch({
                        type: PENDING.TX_RESOLVED,
                        tx,
                        receipt,
                        block
                    })
                });
            }
        });
    }
}


// export function updateLastBlock(hash: string): Action {
//     return {
//         type: 'web3__update_last_block',
//         hash
//     }
// }

export const getTransaction = (web3: Web3, txid: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        web3.eth.getTransaction(txid, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}



export const getBalanceAsync = (web3: Web3, address: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export const getTokenBalanceAsync = (erc20: any, token: string, address: string): Promise<string> => {
    return new Promise((resolve, reject) => {

        const contr = erc20.at(token);
        contr.balanceOf(address, (error: Error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export const getNonceAsync = (web3: Web3, address: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        web3.eth.getTransactionCount(address, (error: Error, result: number) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}


export const getTokenInfoAsync = (erc20: any, address: string): Promise<any> => {
    return new Promise((resolve, reject) => {

        const contract = erc20.at(address, (error, res) => {
            console.warn("callack", error, res)
        });

        console.warn("AT", contract)
        const info = {};
        // TODO: handle errors
        contract.name.call((e, name) => {
            if (e) {
                //resolve(null);
                //return;
            }
            info.name = name;
            contract.symbol.call((e, symbol) => {
                if (e) {
                    resolve(null);
                    return;
                }
                info.symbol = symbol;
                contract.decimals.call((e, decimals) => {
                    if (e) {
                        resolve(null);
                        return;
                    }
                    info.decimals = decimals.toString();
                    resolve(info);
                });
            })
        });
    });
}

export const estimateGas = (web3: Web3, gasOptions: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        web3.eth.estimateGas(gasOptions, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    })
}

export const getGasPrice2 = (web3: Web3): Promise<any> => {
    return new Promise((resolve, reject) => {
        web3.eth.getGasPrice((error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    })
}

export const pushTx = (web3: Web3, tx: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        web3.eth.sendRawTransaction(tx, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    })
}
