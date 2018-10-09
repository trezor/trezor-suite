/* @flow */

import EthereumjsTx from 'ethereumjs-tx';
import EthereumjsUnits from 'ethereumjs-units';
import BigNumber from 'bignumber.js';
import { toHex } from 'web3-utils'; // eslint-disable-line import/no-extraneous-dependencies
import { initWeb3 } from 'actions/Web3Actions';
import * as ethUtils from 'utils/ethUtils';

import type {
    Dispatch,
    PromiseAction,
} from 'flowtype';

import type { EthereumTransaction } from 'trezor-connect';
import type { Token } from 'reducers/TokensReducer';

type EthereumTxRequest = {
    network: string;
    token: ?Token;
    from: string;
    to: string;
    amount: string;
    data: string;
    gasLimit: string;
    gasPrice: string;
    nonce: number;
}

export const prepareEthereumTx = (tx: EthereumTxRequest): PromiseAction<EthereumTransaction> => async (dispatch: Dispatch): Promise<EthereumTransaction> => {
    const instance = await dispatch(initWeb3(tx.network));
    const { token } = tx;
    let data: string = ethUtils.sanitizeHex(tx.data);
    let value: string = toHex(EthereumjsUnits.convert(tx.amount, 'ether', 'wei'));
    let to: string = tx.to; // eslint-disable-line prefer-destructuring
    if (token) {
        // smart contract transaction
        const contract = instance.erc20.clone();
        contract.options.address = token.address;
        const tokenAmount: string = new BigNumber(tx.amount).times(10 ** token.decimals).toString(10);
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
        gasPrice: toHex(EthereumjsUnits.convert(tx.gasPrice, 'gwei', 'wei')),
        r: '',
        s: '',
        v: '',
    };
};

export const serializeEthereumTx = (tx: EthereumTransaction): PromiseAction<string> => async (): Promise<string> => {
    const ethTx = new EthereumjsTx(tx);
    return `0x${ethTx.serialize().toString('hex')}`;
};