/* @flow */
'use strict';

import TrezorConnect, { UI } from 'trezor-connect';
import * as ACTIONS from './index';

//import wallet from 'ethereumjs-wallet';
//import hdkey from 'ethereumjs-wallet/hdkey';
import HDKey from 'hdkey';
import ethUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';
import * as ethereumUtils from '../utils/ethUtils';
import { hexToString, stringToHex } from '../utils/formatUtils';
import * as Web3Actions from './Web3Actions';

export function onSelectDevice2(path: string): any {
    return {
        type: ACTIONS.ON_SELECT_DEVICE,
        path
    }
}

export function discover(txData): any {
    return async function (dispatch) {
        let response = await TrezorConnect.getPublicKey({ path: "m/44'/60'/0'/0", confirmation: false });
        dispatch({
            type: 'create_account',
            xpub: response.data.xpub,
            publicKey: response.data.publicKey,
            chainCode: response.data.chainCode,
            path: response.data.path
        })
    }
}

export function signTx(txData): any {
    return async function (dispatch) {

        console.log("RESP2", txData)

        //txData.nonce = "0x01";
        //txData.gasPrice = "0x02540be400";
        // txData.gasLimit = "0x5208";
        // txData.value = "0x5af3107a4000";

        let response = await TrezorConnect.ethereumSignTransaction({
            //path: "m/44'/60'/0'/0/0",
            address_n: txData.address_n,
            nonce: ethereumUtils.strip(txData.nonce),
            gas_price: ethereumUtils.strip(txData.gasPrice),
            gas_limit: ethereumUtils.strip(txData.gasLimit),
            to: ethereumUtils.strip(txData.to),
            value: ethereumUtils.strip(txData.value),
            data: txData.data,
            chain_id: txData.chainId
        });

        txData.r = '0x' + response.data.r;
        txData.s = '0x' + response.data.s;
        txData.v = web3.toHex(response.data.v);

        console.log("RESP2", response, txData)

        const tx = new EthereumjsTx(txData);
        var signedTx = '0x' + tx.serialize().toString('hex');


        const rawTx2 = {
            "nonce":"0x01",
            "gasPrice":"0x02540be400",
            "gasLimit":"0x5208",
            "to":"0x7314e0f1C0e28474bDb6be3E2c3E0453255188f8",
            "value":"0x5af3107a4000",
            "data":"",
            "chainId":3,
            "v":"0x2a",
            "r":"0x210af4e1698f0437125424ac378da7304dea94dde34cbb57b62624069ceae969",
            "s":"0x74c885c3d32330d63e32dff3b79a302ae5ed9b9abcf6e903fd32cbb91d94b6df"
        }

        var tx2 = new EthereumjsTx(rawTx2);
        var signedTx2 = '0x' + tx2.serialize().toString('hex');

        console.log(signedTx)
        console.log(signedTx2)
        console.log(signedTx === signedTx2)
        console.log(txData, rawTx2)

        // web3.eth.sendRawTransaction(signedTx, function(a1, a2){
        //     console.log("SIGNEEED", a1, a2)
        // })
    }
}

export function onSelectDevice(): any {
    return async function (dispatch, getState) {
        dispatch(Web3Actions.composeTransaction());
    }
}
export function onSelectDeviceWeb3(): any {
    return async function (dispatch, getState) {

        const { web3 } = getState().web3;

        console.log("WEB3333", web3)

        let resp = await TrezorConnect.getPublicKey({ path: "m/44'/60'/0'/0", confirmation: false });

        let hdk = new HDKey();
        hdk.publicKey = new Buffer(resp.data.publicKey, 'hex');
        hdk.chainCode = new Buffer(resp.data.chainCode, 'hex');
        
        var derivedKey = hdk.derive("m/0");

        var address = ethUtil.publicToAddress(derivedKey.publicKey, true);

        // balance 0.100100000000000000 eth
        var txData = {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (60 | 0x80000000) >>> 0,
                (0  | 0x80000000) >>> 0,
                0, 0
            ],
            to: '0x7314e0f1C0e28474bDb6be3E2c3E0453255188f8',
            value: web3.toHex(web3.toWei('0.0001', 'ether')),
            data: '',
            chainId: 3
        }

        web3.eth.getTransactionCount('0x' + address.toString('hex'), (error, result) => {
            txData.nonce = web3.toHex(result);
            const gasOptions = {
                to: txData.to,
                data: txData.data
            }
            web3.eth.estimateGas(gasOptions, (error, result) => {
                txData.gasLimit = web3.toHex(result);

                web3.eth.getGasPrice(function(error, result){
                    if (error) throw error;
        
                    txData.gasPrice = web3.toHex(result);
                    console.warn("gesgas", error, result.toString(10), txData)
        
                    dispatch( signTx(txData) );
                });
            });
        });

        

        

        

        // web3.eth.getTransactionCount('0x' + address.toString('hex'), (error, result) => {
            
        //     if (error) throw error;

        //     console.log("getTransactionCount", result)

        // });

        // let gas = {
        //     to: "0x7314e0f1C0e28474bDb6be3E2c3E0453255188f8", 
        //     data: ""
        // };

        // web3.eth.estimateGas(gas, function(error, result){
        //     console.warn("estimategas", error, result, result.toString(10))

        //     web3.eth.getGasPrice(function(error, result){
        //         console.warn("gesgas", error, result.toString(10) result.)
        //     })

        // });
       

        //console.log("SIGNEEED", signedTx);
       

        //console.log("HDK", derivedKey, address.toString('hex'), rawTx, txData, hexToString(txData.value))
        //console.log("HDK", derivedKey, hexToString(txData.value), txData )

        // const hd = hdkey.fromExtendedKey(resp.data.xpub);
        // console.log("HDKI!", hd)

        
        // var balance = web3.eth.getBalance('0x' + address.toString('hex'), function(error, result){
        //     if(!error)
        //         console.log("res", result, result.toString(10) )
        //     else
        //         console.error("erro", error);
        // });

        

        

        // web3.eth.sendRawTransaction(signedTx, function(a1, a2){
        //     console.log("SIGNEEED", a1, a2)
        // })
        //console.log(web3.eth)
        //web3.eth.sendRawTransaction(signedTx).on('receipt', console.log);

        // web3.eth.getTransactionCount('0x' + address.toString('hex'), function(error, result) {
        // //web3.eth.getTransactionCount("0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe", function(error, result) {
        //     console.log("getTransactionCount", error, result)
        // })

        // web3.eth.getAccounts(console.log)

        // const nonce = '03'; // note - it is hex, not number!!!
        // const gas_price = '098bca5a00';
        // const gas_limit = 'a43f';
        // const to = 'e0b7927c4af23765cb51314a0e0521a9645f0e2a';
        // // var value = '01'; // in hexadecimal, in wei - this is 1 wei
        // const value = '010000000000000000'; // in hexadecimal, in wei - this is about 18 ETC
        // const data = 'a9059cbb000000000000000000000000dc7359317ef4cc723a3980213a013c0433a338910000000000000000000000000000000000000000000000000000000001312d00'; // some contract data 
        // // var data = null  // for no data
        // const chain_id = 1; // 1 for ETH, 61 for ETC

        // let resp2 = await TrezorConnect.ethereumSignTransaction({ 
        //     address_n,
        //     nonce,
        //     gas_price,
        //     gas_limit,
        //     to,
        //     value,
        //     data,
        //     chain_id
        // });

        


        // old fallback
        // this.signEthereumTx = function (
        //     address_n,
        //     nonce,
        //     gas_price,
        //     gas_limit,
        //     to,
        //     value,
        //     data,
        //     chain_id,
        //     callback,
        //     requiredFirmware
        // )

        // var coinbase = web3.eth.coinbase;
        // var balance = web3.eth.getBalance(coinbase);
        // console.log(balance.toString(10));

        // dispatch({
        //     type: 'DDD'
        // });
    }
}