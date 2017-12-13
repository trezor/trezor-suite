/* @flow */
'use strict';

import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import { strip } from '../utils/ethUtils';

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

export function getBalance(web3, address) {
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

export function getNonce(web3, address) {
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

export function getGasPrice(web3) {
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

export function push(web3, tx) {
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

export function composeTransaction() {
    return async function (dispatch, getState) {
        const { web3 } = getState().web3;
        const { address, amount } = getState().sendForm;

        const resp = await TrezorConnect.getPublicKey({ path: "m/44'/60'/0'/0", confirmation: false });
        
        const hdk = new HDKey();
        hdk.publicKey = new Buffer(resp.data.publicKey, 'hex');
        hdk.chainCode = new Buffer(resp.data.chainCode, 'hex');

        const derivedKey = hdk.derive("m/0");
        const myAddress = EthereumjsUtil.publicToAddress(derivedKey.publicKey, true);

        const txData = {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (60 | 0x80000000) >>> 0,
                (0  | 0x80000000) >>> 0,
                0, 0
            ],
            to: address,
            value: web3.toHex(web3.toWei(amount, 'ether')),
            data,
            chainId: 3
        }

        console.log("NONCE", myAddress)
        const nonce = await getNonce(web3, '0x' + myAddress.toString('hex') );
        console.log("NONCE", nonce)

        const gasOptions = {
            to: txData.to,
            data: txData.data
        }
        const gasLimit = await estimateGas(web3, gasOptions);
        const gasPrice = await getGasPrice(web3);

        txData.nonce = web3.toHex(nonce);
        txData.gasLimit = web3.toHex(gasLimit);
        txData.gasPrice = web3.toHex(gasPrice);

        console.log("NONCE", nonce, gasLimit, gasPrice)

        let signedTransaction = await TrezorConnect.ethereumSignTransaction({
            //path: "m/44'/60'/0'/0/0",
            address_n: txData.address_n,
            nonce: strip(txData.nonce),
            gas_price: strip(txData.gasPrice),
            gas_limit: strip(txData.gasLimit),
            to: strip(txData.to),
            value: strip(txData.value),
            data: txData.data,
            chain_id: txData.chainId
        });

        txData.r = '0x' + signedTransaction.data.r;
        txData.s = '0x' + signedTransaction.data.s;
        txData.v = web3.toHex(signedTransaction.data.v);

        const tx = new EthereumjsTx(txData);
        const serializedTx = '0x' + tx.serialize().toString('hex');

        const txid = await push(web3, serializedTx);

        dispatch({
            type: 'tx_complete',
            txid
        })

        console.log("TXID", txid);
    }
}