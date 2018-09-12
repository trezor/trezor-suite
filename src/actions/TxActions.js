/* @flow */

import EthereumjsTx from 'ethereumjs-tx';
import EthereumjsUnits from 'ethereumjs-units';
import BigNumber from 'bignumber.js';
import { toHex } from 'web3-utils';
import { initWeb3 } from './Web3Actions';

import type {
    Dispatch,
    GetState,
    PromiseAction,
    EthereumTxRequest,
    EthereumPreparedTx
} from 'flowtype';


export const prepareEthereumTx = (tx: EthereumTxRequest): PromiseAction<EthereumPreparedTx> => async (dispatch: Dispatch, getState: GetState): Promise<EthereumPreparedTx> => {
    const instance = await dispatch( initWeb3(tx.network) );
    const token = tx.token;
    let data: string = `0x${tx.data}`; // TODO: check if already prefixed
    let value: string = toHex( EthereumjsUnits.convert(tx.amount, 'ether', 'wei') );
    let to: string = tx.to;

    if (token) {
        // smart contract transaction
        const contract = instance.erc20.clone();
        contract.options.address = token.address;
        const tokenAmount: string = new BigNumber(tx.amount).times(Math.pow(10, token.decimals)).toString(10);
        data = instance.erc20.methods.transfer(to, tokenAmount).encodeABI();
        value = '0x00';
        to = token.address;
    }

    return {
        to,
        value,
        data,
        chainId: instance.chainId,
        nonce: toHex(tx.nonce),
        gasLimit: toHex(tx.gasLimit),
        gasPrice: toHex( EthereumjsUnits.convert(tx.gasPrice, 'gwei', 'wei') ),
        r: '',
        s: '',
        v: '',
    }
};

export const serializeEthereumTx = (tx: EthereumPreparedTx): PromiseAction<string> => async (dispatch: Dispatch, getState: GetState): Promise<string> => {
    const ethTx = new EthereumjsTx(tx);
    console.warn("SERIALIZE 1", `0x${ ethTx.serialize().toString('hex') }`)
    console.warn("SERIALIZE 2", toHex( ethTx.serialize() ))
    return `0x${ ethTx.serialize().toString('hex') }`;
    // return toHex( ethTx.serialize() );
}