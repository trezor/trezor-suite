/* @flow */
'use strict';

import Web3 from 'web3';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as ACTIONS from '../actions/index';
import { getBalance, getGasPrice, getTransactionReceipt } from '../actions/Web3Actions';
import { loadTransactionStatus } from './EtherscanService';
import BigNumber from 'bignumber.js';

let web3: Web3;

// export const getGasPrice = (): Promise<BigNumber> => {
//     return (dispatch, getState) => {
//         web3.eth.getGasPrice((error, gasPrice) => {
//             if (!error) {
//                 dispatch({
//                     type: 'update_gas',
//                     gasPrice: web3.fromWei(gasPrice.toString(), 'gwei')
//                 })
//             }
//         });
//     }
// }



const Web3Service = store => next => action => {

    next(action);

    switch (action.type) {

        case 'WEB_2_START' : 
            if (web3) break;

            //web3 = new Web3(window.web3.currentProvider);
            //web3 = new Web3(new Web3.providers.HttpProvider("https://api.myetherapi.com/rop"));
            web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io2/QGyVKozSUEh2YhL4s2G4"));
            //web3 = new Web3( new Web3.providers.HttpProvider("ws://34.230.234.51:30303") );




            /*store.dispatch( getGasPrice() );


            const latestBlockFilter = web3.eth.filter('latest');
            latestBlockFilter.watch((error, blockHash) => {

                const { addresses, pendingTxs } = store.getState().addresses;

                for (const addr of addresses) {
                    store.dispatch( getBalance(addr) );
                }

                store.dispatch( getGasPrice() );

                if (pendingTxs.length > 0) {
                    for (const tx of pendingTxs) {
                        store.dispatch( getTransactionReceipt(tx) );
                    }
                }
            });*/



            // store.dispatch({
            //     type: 'web3__init',
            //     web3
            // });

            // store.dispatch({
            //     type: 'update_gas',
            //     gasPrice: web3.fromWei(web3.eth.gasPrice, 'gwei')
            // })

            /*
            {
                "dd62ed3e": "allowance(address,address)",
                "095ea7b3": "approve(address,uint256)",
                "cae9ca51": "approveAndCall(address,uint256,bytes)",
                "70a08231": "balanceOf(address)",
                "313ce567": "decimals()",
                "06fdde03": "name()",
                "95d89b41": "symbol()",
                "18160ddd": "totalSupply()",
                "a9059cbb": "transfer(address,uint256)",
                "23b872dd": "transferFrom(address,address,uint256)",
                "54fd4d50": "version()"
            }*/

            // var balanceHex = "06fdde03"; // I believe this is the hex for balance
            // var contractAddress = "0x58cda554935e4a1f2acbe15f8757400af275e084";
            // var userAddress = "0x5DBB9793537515398A1176d365b636A5321D9e39";
            // var balanceCall = getDataObj(contractAddress, balanceHex);
            // var balance = web3.eth.call(balanceCall);




            const abiArray = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
            //const contr = web3.eth.contract(abiArray, '0x58cda554935e4a1f2acbe15f8757400af275e084');
            const contr = web3.eth.contract(abiArray).at('0x58cda554935e4a1f2acbe15f8757400af275e084');
            console.log("contr", contr );

            contr.name.call((e,r) => {
                console.log("nameeeee", e, r)
            })

            contr.symbol.call((e,r) => {
                console.log("symboll", e, r)
            })

            //console.log( const.name )

            // contr.balanceOf('0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad', (e, r) => {
            //     console.warn('contrR', e, r.toString(10));
            // });

            let cntrData = contr.transfer.getData("0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad", 1, {
                from: "0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad",
                gasLimit: 36158,
                gasPrice: "0x0ee6b28000"
            })

            console.log("contr", cntrData);
            // const data = contr.transferFrom(
            //     '0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad',
            //     '0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad',
            //     1
            // );

            // const data = contr.transferFrom(
            //         '0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad',
            //         {
            //             from: '0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8',
            //             value: 1
            //         }
            // );
            
            // const data = contr.transferFrom(
            //     '0x00000000000000000000000098ead4bd2fbbb0cf0b49459aa0510ef53faa6cad',
            //     '0x000000000000000000000000a738ea40b69d87f4f9ac94c9a0763f96248df23b', 
            //     2
            // );
            //console.log("contr", contr, data)

            // var addr1 = '0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad';
            // var contractAddr = '0x58cda554935e4a1f2acbe15f8757400af275e084';
            // var tknAddress = (addr1).substring(2);
            // var contractData = ('0x70a08231000000000000000000000000' + tknAddress);

            // console.warn("ADDDDDDDD", web3.toHex('0x98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad'));
            // console.warn("ADDDDDDDD", web3.toHex('98ead4bd2fbbb0cf0b49459aa0510ef53faa6cad'));

            // web3.eth.call({
            //     to: contractAddr, 
            //     data: contractData  
            //     }, function(err, result) {
            //     if (result) { 
            //         console.log("---------result", result, web3);
            //         //var tokens = web3.toBN(result).toString(); 
            //         //console.log('Tokens Owned: ' + web3.utils.fromWei(tokens, 'ether'));
            //     }
            //     else {
            //         console.log(err); // Dump errors here
            //     }
            // });

            

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

            
        break;

    }

    
};

export default Web3Service;


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