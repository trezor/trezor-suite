/* @flow */
'use strict';

import Web3 from 'web3';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as ACTIONS from '../actions/index';
import { loadTransactionStatus } from './EtherscanService';
import BigNumber from 'bignumber.js';

let web3: Web3;

// let pendingTxs: Array<any> = [];


export const getGasPrice = (): Promise<BigNumber> => {
    return (dispatch, getState) => {
        web3.eth.getGasPrice((error, gasPrice) => {
            if (!error) {
                dispatch({
                    type: 'update_gas',
                    gasPrice: web3.fromWei(gasPrice.toString(), 'gwei')
                })
            }
        });
    }
}



const Web3Service = store => next => action => {

    switch (action.type) {

        // case ACTIONS.ON_TX_COMPLETE : 
        //     pendingTxs.push(action.txid);

        //     // const refreshBalance = async (sender) => {
        //     //     let balance = await getBalance(sender.address);
        //     //     store.dispatch({
        //     //         type: ACTIONS.ADDRESS_SET_BALANCE,
        //     //         address: sender,
        //     //         balance: web3.fromWei(balance.toString(), 'ether')
        //     //     })
        //     // }

        //     // const sender = action.address;
        //     // setInterval( async () =>{
        //     //     let balance = await getBalance(sender.address);
        //     //     console.log("update balance", web3.fromWei(balance.toString(), 'ether') )
        //     // }, 2000);
            
        // break;

        // case ACTIONS.TX_STATUS_OK :
        //     let pendingIndex = pendingTxs.indexOf(action.txid);
        //     if (pendingIndex >= 0) {
        //         pendingTxs.splice(pendingIndex, 1);
        //     }
        // break;

        case LOCATION_CHANGE : 
            if (web3) break;

            web3 = new Web3(window.web3.currentProvider);
            //web3 = new Web3(new Web3.providers.HttpProvider("https://api.myetherapi.com/rop"));
            //web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/QGyVKozSUEh2YhL4s2G4"));
            //web3 = new Web3("ws://34.230.234.51:30303");
            //web3 = new Web3("ws://58.56.184.146:45536");
            //web3 = new Web3(new Web3.providers.HttpProvider('https://api.myetherapi.com/rop'));
            //web3.setProvider(new Web3.providers.HttpProvider('https://api.myetherapi.com/rop') );
            //web3 = new Web3( new Web3.providers.HttpProvider("ws://34.230.234.51:30303") );

            // store.dispatch({
            //     type: 'update_gas',
            //     gasPrice: web3.fromWei(web3.eth.gasPrice, 'gwei')
            // })

            const latestBlockFilter = web3.eth.filter('latest');
            //const latestBlockFilter = web3.eth.filter('pending');
            latestBlockFilter.watch((error, txid) => {
                //console.log("Watch latest block", txid, error);

                store.dispatch( getGasPrice() );

                const { pendingTxs } = store.getState().addresses;

                if (pendingTxs.length > 0) {
                    // let pendingTxIndex = pendingTxs.indexOf(txid);
                    // console.error("---->>>Watch latest block", pendingTxIndex, txid, pendingTxs)
                    // if (pendingTxIndex >= 0) {
                    //     pendingTxs.splice(pendingTxIndex, 1);
                    // }

                    store.dispatch( loadTransactionStatus(pendingTxs[0]) );
                }

                // if (!error) {
                //     web3.eth.getTransactionReceipt(txid, (error, tx) => {
                //         console.log("LatestTX", txid, tx, error)
                //     })
                // }
            });

            /*
            const pendingBlockFilter = web3.eth.filter('pending');
            pendingBlockFilter.watch((error, txid) => {
                //console.warn("Watch pending block", txid, error)
                if (!error) {

                    if (pendingTx.length > 0) {
                        console.error("Watch pending block", pendingTx.indexOf(txid))
                    }

                    web3.eth.getTransactionReceipt(txid, async (error, tx) => {
                        if (!error && typeof tx === 'object') {
                            const { addresses } = store.getState().addresses;
                            const receiver = addresses.find(a => a.address === tx.to);
                            if (receiver) {
                                console.error("PendingTX RECV", txid, tx, receiver)
                                const balance = await getBalance(receiver.address);
                                store.dispatch({
                                    type: ACTIONS.ADDRESS_SET_BALANCE,
                                    txid,
                                    address: receiver,
                                    balance: web3.fromWei(balance.toString(), 'ether')
                                })
                            }
                            const sender = addresses.find(a => a.address === tx.from);
                            if (sender) {
                                const balance = await getBalance(sender.address);
                                store.dispatch({
                                    type: ACTIONS.ADDRESS_SET_BALANCE,
                                    txid,
                                    address: sender,
                                    balance: web3.fromWei(balance.toString(), 'ether')
                                })
                            }

                            //console.log("PendingTX", txid, tx, receiver, sender)
                        }
                    })
                }
            });
            */

            //"web3": "^0.19.0"

            console.log("WEB#", web3)
            store.dispatch({
                type: 'web3__init',
                web3
            })
        break;

    }

    next(action);
};

export default Web3Service;

const updateGas = async () => {

}

export const watchPendingTx = (address: string): Promise<boolean> => {
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

export const getBalance = (address: string): Promise<BigNumber> => {
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



export const estimateGas = (gasOptions): Promise<any> => {
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