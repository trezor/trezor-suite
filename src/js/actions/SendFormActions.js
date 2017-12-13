/* @flow */
'use strict';

import * as ACTIONS from './index';
import { getNonce, estimateGas, getGasPrice, push } from './Web3Actions';

import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import { strip } from '../utils/ethUtils';


export const onAddressChange = (address: string): void => {
    return {
        type: ACTIONS.ON_ADDRESS_CHANGE,
        address
    }
}

export const onAmountChange = (amount: string): void => {
    return {
        type: ACTIONS.ON_AMOUNT_CHANGE,
        amount
    }
}

export const onGasPriceChange = (gasPrice: string): void => {
    return {
        type: ACTIONS.ON_GAS_PRICE_CHANGE,
        gasPrice
    }
}

export const onGasLimitChange = (gasLimit: string): void => {
    return {
        type: ACTIONS.ON_GAS_LIMIT_CHANGE,
        gasLimit
    }
}

export const onTxDataChange = (data: string): void => {
    return {
        type: ACTIONS.ON_TX_DATA_CHANGE,
        data
    }
}

export const onSend = (addressId): void => {
    return async (dispatch, getState) => {
        const { web3 } = getState().web3;
        const { address, amount } = getState().sendForm;
        const { addresses } = getState().addresses;

        const currentAddress = addresses[addressId];
        const address_n = currentAddress.path;

        const txData = {
            address_n,
            to: address,
            value: web3.toHex(web3.toWei(amount, 'ether')),
            data: '',
            chainId: 3
        }

        const nonce = await getNonce(web3, currentAddress.address);
        const gasOptions = {
            to: txData.to,
            data: txData.data
        }
        const gasLimit = await estimateGas(web3, gasOptions);
        const gasPrice = await getGasPrice(web3);

        txData.nonce = web3.toHex(nonce);
        txData.gasLimit = web3.toHex(gasLimit);
        txData.gasPrice = web3.toHex(gasPrice);

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
            type: ACTIONS.ON_TX_COMPLETE,
            address: currentAddress,
            txid,
            txData,
        })
    }
}
