// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/signtxVerify.js

import {
    bip32,
    address as BitcoinJsAddress,
    payments as BitcoinJsPayments,
    Transaction as BitcoinJsTransaction,
} from '@trezor/utxo-lib';
import { PROTO, ERRORS } from '../../constants';
import { getOutputScriptType } from '../../utils/pathUtils';

import type { BitcoinNetworkInfo } from '../../types';
import type { HDNodeResponse } from '../../types/api/getPublicKey';

type GetHDNode = (
    path: number[],
    coinInfo?: BitcoinNetworkInfo,
    validation?: boolean,
) => Promise<HDNodeResponse>;

const derivePubKeyHash = async (
    address_n: number[],
    getHDNode: GetHDNode,
    coinInfo: BitcoinNetworkInfo,
) => {
    // regular bip44 output
    if (address_n.length === 5) {
        const response = await getHDNode(address_n.slice(0, 4), coinInfo);
        const node = bip32.fromBase58(response.xpub, coinInfo.network);
        return node.derive(address_n[address_n.length - 1]);
    }
    // custom address_n
    const response = await getHDNode(address_n, coinInfo);
    return bip32.fromBase58(response.xpub, coinInfo.network);
};

const deriveOutputScript = async (
    getHDNode: GetHDNode,
    output: PROTO.TxOutputType,
    coinInfo: BitcoinNetworkInfo,
) => {
    // skip multisig output check, not implemented yet
    // TODO: implement it
    if ('multisig' in output) return;

    if ('op_return_data' in output) {
        return BitcoinJsPayments.embed({ data: [Buffer.from(output.op_return_data, 'hex')] })
            .output;
    }

    if (output.address) {
        return BitcoinJsAddress.toOutputScript(output.address, coinInfo.network);
    }

    if (!output.address_n) {
        throw ERRORS.TypedError(
            'Runtime',
            'deriveOutputScript: Neither address or address_n is set',
        );
    }

    const scriptType = getOutputScriptType(output.address_n);
    const node = await derivePubKeyHash(output.address_n, getHDNode, coinInfo);
    const payment = { hash: node.identifier, network: coinInfo.network };

    if (scriptType === 'PAYTOADDRESS') {
        return BitcoinJsPayments.p2pkh(payment).output;
    }

    if (scriptType === 'PAYTOSCRIPTHASH') {
        return BitcoinJsPayments.p2sh(payment).output;
    }

    if (scriptType === 'PAYTOP2SHWITNESS') {
        return BitcoinJsPayments.p2sh({
            redeem: BitcoinJsPayments.p2wpkh(payment),
        }).output;
    }

    if (scriptType === 'PAYTOWITNESS') {
        return BitcoinJsPayments.p2wpkh(payment).output;
    }

    if (scriptType === 'PAYTOTAPROOT') {
        return BitcoinJsPayments.p2tr({
            pubkey: node.publicKey,
            network: coinInfo.network,
        }).output;
    }

    throw ERRORS.TypedError('Runtime', `deriveOutputScript: Unknown script type ${scriptType}`);
};

export const verifyTx = async (
    getHDNode: GetHDNode,
    inputs: PROTO.TxInputType[],
    outputs: PROTO.TxOutputType[],
    serializedTx: string,
    coinInfo: BitcoinNetworkInfo,
) => {
    // deserialize signed transaction
    const bitcoinTx = BitcoinJsTransaction.fromHex(serializedTx, { network: coinInfo.network });

    // check inputs and outputs length
    if (inputs.length !== bitcoinTx.ins.length) {
        throw ERRORS.TypedError('Runtime', 'verifyTx: Signed transaction inputs invalid length');
    }

    if (outputs.length !== bitcoinTx.outs.length) {
        throw ERRORS.TypedError('Runtime', 'verifyTx: Signed transaction outputs invalid length');
    }

    // check outputs scripts
    for (let i = 0; i < outputs.length; i++) {
        const scriptB = bitcoinTx.outs[i].script;

        if (outputs[i].amount) {
            const { amount } = outputs[i];
            if (amount.toString() !== bitcoinTx.outs[i].value) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `verifyTx: Wrong output amount at output ${i}. Requested: ${amount}, signed: ${bitcoinTx.outs[i].value}`,
                );
            }
        }

        const scriptA = await deriveOutputScript(getHDNode, outputs[i], coinInfo);
        if (scriptA && scriptA.compare(scriptB) !== 0) {
            throw ERRORS.TypedError('Runtime', `verifyTx: Output ${i} scripts differ`);
        }
    }
};

export const verifyTicketTx = async (
    getHDNode: GetHDNode,
    inputs: PROTO.TxInputType[],
    outputs: PROTO.TxOutputType[],
    serializedTx: string,
    coinInfo: BitcoinNetworkInfo,
) => {
    // deserialize signed transaction
    const bitcoinTx = BitcoinJsTransaction.fromHex(serializedTx, { network: coinInfo.network });

    // check inputs and outputs length
    if (inputs.length !== bitcoinTx.ins.length) {
        throw ERRORS.TypedError(
            'Runtime',
            'verifyTicketTx: Signed transaction inputs invalid length',
        );
    }

    if (outputs.length !== bitcoinTx.outs.length || outputs.length !== 3) {
        throw ERRORS.TypedError(
            'Runtime',
            'verifyTicketTx: Signed transaction outputs invalid length',
        );
    }

    // check outputs scripts
    for (let i = 0; i < outputs.length; i++) {
        const scriptB = bitcoinTx.outs[i].script;
        const output = outputs[i];
        let scriptA;
        if (i === 0) {
            const { amount } = output;
            if (amount !== bitcoinTx.outs[i].value) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `verifyTicketTx: Wrong output amount at output ${i}. Requested: ${amount}, signed: ${bitcoinTx.outs[i].value}`,
                );
            }
            scriptA = BitcoinJsPayments.sstxpkh({
                address: output.address,
                network: coinInfo.network,
            }).output;
        } else if (i === 1) {
            // Should be no script.
            if (output.address) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `verifyTicketTx: Output 1 should not have address.`,
                );
            }
            if (!output.address_n) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `verifyTicketTx: Output 1 should have address_n.`,
                );
            }

            const node = await derivePubKeyHash(output.address_n, getHDNode, coinInfo);
            scriptA = BitcoinJsPayments.sstxcommitment({
                hash: node.identifier,
                amount: output.amount.toString(),
                network: coinInfo.network,
            }).output;
        } else {
            const { amount } = output;
            if (amount !== bitcoinTx.outs[i].value) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `verifyTicketTx: Wrong output amount at output ${i}. Requested: ${amount}, signed: ${bitcoinTx.outs[i].value}`,
                );
            }
            scriptA = BitcoinJsPayments.sstxchange({
                address: output.address,
                network: coinInfo.network,
            }).output;
        }

        if (scriptA && scriptA.compare(scriptB) !== 0) {
            throw ERRORS.TypedError('Runtime', `verifyTx: Output ${i} scripts differ`);
        }
    }
};
