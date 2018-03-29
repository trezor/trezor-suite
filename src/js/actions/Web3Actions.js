/* @flow */
'use strict';

import Web3 from 'web3';
import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import { strip } from '../utils/ethUtils';
import * as ACTIONS from './index';
import * as ADDRESS from './constants/Address';
import * as WEB3 from './constants/Web3';
import { loadHistory } from '../services/EtherscanService';
import { httpRequest } from '../utils/networkUtils';

type ActionMethod = (dispatch: any, getState: any) => Promise<any>;

type Web3Payload = 
| {
    name: string;
    instance: Web3;
    chainId: number;
    erc20abi: any;
}
| {
    network: string;
    blockHash: string;
}
| {
    network: string;
    gasPrice: string;
}
| {
    network: string;
    address: string;
    balance: string;
}
| {
    network: string;
    address: string;
    nonce: string;
}
| {
    network: string;
    blockHash: string;
};

type Web3Action = {
    type: string,
    payload?: Web3Payload 
};


export function init(web3: ?Web3, coinIndex: number = 0): ActionMethod {
    return async (dispatch, getState) => {

        const { config, ERC20Abi } = getState().localStorage;

        const coin = config.coins[ coinIndex ];
        if (!coin) {
            // all instances done
            dispatch({
                type: WEB3.READY,
            });
            return;
        }

        const coinName = coin.network;
        const urls = coin.backends[0].urls;

        let web3host: string = urls[0];

        if (web3) {
            const currentHost = web3.currentProvider.host;
            let currentHostIndex: number = urls.indexOf(currentHost);

            if (currentHostIndex + 1 < urls.length) {
                web3host = urls[currentHostIndex + 1];
            } else {
                console.error("TODO: Backend " + coinName + " not working");
                // try next coin
                dispatch( init(web3, coinIndex + 1) );
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
        // instance.version.getNetwork(function(error, chainId){
        //     if (!error) {

        
        
        instance.eth.getGasPrice((error, gasPrice) => {
            if (error) {
                // try different url
                dispatch( init(instance, coinIndex) );
            } else {

                const erc20 = instance.eth.contract(ERC20Abi);

                dispatch({
                    type: WEB3.CREATE,
                    name: coinName,
                    web3: instance,
                    erc20,
                    chainId: instance.version.network
                });

                dispatch({
                    type: WEB3.GAS_PRICE_UPDATED,
                    coin: coinName,
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

                const onBlockMined = async (error, blockHash) => {
                    if (error) {

                        window.setTimeout(() => {
                            // try again
                            onBlockMined("manually_triggered_error", undefined);
                        }, 30000);
                    }

                    if (blockHash) {
                        dispatch({
                            type: WEB3.BLOCK_UPDATED,
                            name: coinName,
                            blockHash
                        });
                    }

                    // TODO: filter only current device
                    const accounts = getState().accounts.filter(a => a.coin === coinName);
                    for (const addr of accounts) {
                        dispatch( getBalance(addr) );
                        dispatch( getNonce(addr) );
                    }

                    dispatch( getGasPrice(coinName) );

                    const pending = getState().pending.filter(p => p.coin === coinName);
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

function initBlockTicker() {

}

export function initContracts(): ActionMethod {
    return async (dispatch, getState) => {
        const { web3, abi, tokens } = getState().web3;

        const contracts = [];
        for (let token of tokens) {
            contracts.push({
                contract: web3.eth.contract(abi).at(token.address),
                name: token.name,
                symbol: token.symbol,
                decimal: token.decimal
            });

            // web3.eth.contract(abi).at(token.address).balanceOf('0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad', (e, r) => {
            //     console.warn('contrR', e, r.toString(10));
            // });
        }

        const contract = web3.eth.contract(abi).at('0x58cda554935e4a1f2acbe15f8757400af275e084');

        contract.name.call((error, name) => {
            if (error) {
                // TODO: skip
            }
            contract.symbol.call((error, symbol) => {
                if (error) {
                    // TODO: skip
                }

                contract.decimals.call((error, decimals) => {
                    console.log("nameeeee", name, symbol, decimals)
                })
            });
            
            
        })
    }
}


export function getGasPrice(coinName: string): ActionMethod {
    return async (dispatch, getState) => {

        const index: number = getState().web3.findIndex(w3 => {
            return w3.coin === coinName;
        });

        const web3 = getState().web3[ index ].web3;
        web3.eth.getGasPrice((error, gasPrice) => {
            if (!error) {
                dispatch({
                    type: WEB3.GAS_PRICE_UPDATED,
                    coin: coinName,
                    gasPrice
                });
            }
        });
    }
}

export function getBalance(addr: Address): ActionMethod {
    return async (dispatch, getState) => {

        const web3instance = getState().web3.filter(w3 => w3.coin === addr.coin)[0];
        const web3 = web3instance.web3;

        web3.eth.getBalance(addr.address, (error, balance) => {
            if (!error) {
                const newBalance: string = web3.fromWei(balance.toString(), 'ether');
                if (addr.balance !== newBalance) {
                    dispatch({
                        type: ADDRESS.SET_BALANCE,
                        address: addr.address,
                        coin: addr.coin,
                        balance: newBalance
                    });

                    // dispatch( loadHistory(addr) );
                }
            }
        });
    }
}

export function getNonce(addr: Address) {

    return async (dispatch, getState) => {

        const web3instance = getState().web3.filter(w3 => w3.coin === addr.coin)[0];
        const web3 = web3instance.web3;

        web3.eth.getTransactionCount(addr.address, (error, result) => {
            if (!error) {
                if (addr.nonce !== result) {
                    dispatch({
                        type: ADDRESS.SET_NONCE,
                        address: addr.address,
                        coin: addr.coin,
                        nonce: result
                    });
                }
            }
        });
    }
}

export function getTransactionReceipt(tx: any): any {
    return async (dispatch, getState) => {

        const web3instance = getState().web3.filter(w3 => w3.coin === tx.coin)[0];
        const web3 = web3instance.web3;

        //web3.eth.getTransactionReceipt(txid, (error, tx) => {
        web3.eth.getTransaction(tx.id, (error, receipt) => {
            console.log("RECEIP", receipt)
            if (receipt && receipt.blockNumber) {
                web3.eth.getBlock(receipt.blockHash, (error, block) => {
                    console.log("---MAMM BLOCK", error, block, receipt, receipt.blockHash)
                    dispatch({
                        //type: ACTIONS.TX_CONFIRMED,
                        type: WEB3.PENDING_TX_RESOLVED,
                        tx,
                        receipt,
                        block
                    })
                });
            }
        });
    }
}


export function updateLastBlock(hash: string) {
    return {
        type: 'web3__update_last_block',
        hash
    }
}

export function getTransaction(web3, txid) {
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



export function getBalanceAsync(web3, address) {
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

export const getTokenBalanceAsync = (erc20: any, token: any, address: any): Promise<any> => {
    return new Promise((resolve, reject) => {

        const contr = erc20.at(token);
        contr.balanceOf(address, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export function getNonceAsync(web3, address) {
    return new Promise((resolve, reject) => {
        web3.eth.getTransactionCount(address, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}


export function getTokenInfoAsync(erc20: any, address: string): Promise<any> {
    return new Promise((resolve, reject) => {

        const contract = erc20.at(address);
        const info = {};
        // TODO: handle errors
        contract.name.call((e, name) => {
            if (e) {
                //console.log("1", address, e)
                //resolve(null);
                //return;
            }
            info.name = name;
            contract.symbol.call((e, symbol) => {
                if (e) {
                    console.log("2", e)
                    resolve(null);
                    return;
                }
                info.symbol = symbol;
                contract.decimals.call((e, decimals) => {
                    if (e) {
                        console.log("3", e)
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

export function estimateGas(web3, gasOptions) {
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

export function getGasPrice2(web3) {
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

export function pushTx(web3, tx) {
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




