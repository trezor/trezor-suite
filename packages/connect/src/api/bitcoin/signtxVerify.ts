// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/signtxVerify.js

import type { Network, PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    address as BitcoinJsAddress,
    payments as BitcoinJsPayments,
    Transaction as BitcoinJsTransaction,
    bip32,
} from '@trezor/utxo-lib';

import type { DeviceCommands } from '../../device/DeviceCommands';

type GetHDNode = (
    address_n: number[],
) => ReturnType<ReturnType<typeof DeviceCommands>['getHDNode']>;

const derivePubKeyHash = async (getHDNode: GetHDNode, address_n: number[], network: Network) => {
    // regular bip44 output
    if (address_n.length === 5) {
        const response = await getHDNode(address_n.slice(0, 4));
        const node = bip32.fromBase58(response.xpub, network);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const lastComponent: number = address_n[address_n.length - 1];

        return node.derive(lastComponent);
    }
    // custom address_n
    const response = await getHDNode(address_n);

    return bip32.fromBase58(response.xpub, network);
};

export const deriveOutputScript = async (
    getHDNode: GetHDNode,
    output: PROTO.TxOutputType,
    network: Network,
) => {
    // skip multisig output check, not implemented yet
    // TODO: implement it
    if ('multisig' in output) return;

    if ('op_return_data' in output) {
        return BitcoinJsPayments.embed({ data: [Buffer.from(output.op_return_data, 'hex')] })
            .output;
    }

    if (output.address) {
        return BitcoinJsAddress.toOutputScript(output.address, network);
    }

    if (!output.address_n) {
        throw ERRORS.TypedError(
            'Runtime',
            'deriveOutputScript: Neither address or address_n is set',
        );
    }

    const node = await derivePubKeyHash(getHDNode, output.address_n, network);
    const payment = { hash: node.identifier, network };

    if (output.script_type === 'PAYTOADDRESS') {
        return BitcoinJsPayments.p2pkh(payment).output;
    }

    if (output.script_type === 'PAYTOSCRIPTHASH') {
        return BitcoinJsPayments.p2sh(payment).output;
    }

    if (output.script_type === 'PAYTOP2SHWITNESS') {
        return BitcoinJsPayments.p2sh({
            redeem: BitcoinJsPayments.p2wpkh(payment),
        }).output;
    }

    if (output.script_type === 'PAYTOWITNESS') {
        return BitcoinJsPayments.p2wpkh(payment).output;
    }

    if (output.script_type === 'PAYTOTAPROOT') {
        return BitcoinJsPayments.p2tr({
            pubkey: node.publicKey,
            network,
        }).output;
    }

    // ts. this should never happen since there is check for multisig property before this line
    if (output.script_type === 'PAYTOMULTISIG') {
        throw ERRORS.TypedError(
            'Runtime',
            `deriveOutputScript: script_type PAYTOMULTISIG not expected without multisig defined`,
        );
    }

    throw ERRORS.TypedError(
        'Runtime',
        `deriveOutputScript: Unknown script type ${output.script_type}`,
    );
};

export const verifyTx = (
    serializedTx: string,
    params: {
        inputs: PROTO.TxInputType[];
        outputs: PROTO.TxOutputType[];
        outputScripts: Awaited<ReturnType<typeof deriveOutputScript>>[];
        network: Network;
    },
): BitcoinJsTransaction => {
    const { inputs, outputs, outputScripts, network } = params;
    // deserialize signed transaction
    const bitcoinTx = BitcoinJsTransaction.fromHex(serializedTx, { network });

    // check inputs and outputs length
    if (inputs.length !== bitcoinTx.ins.length) {
        throw ERRORS.TypedError('Runtime', 'verifyTx: Signed transaction inputs invalid length');
    }

    if (outputs.length !== bitcoinTx.outs.length) {
        throw ERRORS.TypedError('Runtime', 'verifyTx: Signed transaction outputs invalid length');
    }

    outputs.forEach((output, i) => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const txOut: (typeof bitcoinTx.outs)[number] = bitcoinTx.outs[i];
        if (output.amount) {
            if (output.amount.toString() !== txOut.value) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `verifyTx: Wrong output amount at output ${i}. Requested: ${output.amount}, signed: ${txOut.value}`,
                );
            }
        }
    });

    // check outputs scripts
    for (let i = 0; i < outputs.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const out: (typeof bitcoinTx.outs)[number] = bitcoinTx.outs[i];
        const scriptB = out.script;

        const scriptA = outputScripts[i];
        if (scriptA && scriptA.compare(scriptB) !== 0) {
            throw ERRORS.TypedError('Runtime', `verifyTx: Output ${i} scripts differ`);
        }
    }

    return bitcoinTx;
};
