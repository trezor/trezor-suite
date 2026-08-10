import type { AccountAddresses, AccountUtxo, PrecomposeResultFinal } from '@trezor/connect-common';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { bufferUtils } from '@trezor/utils';
import type { Network } from '@trezor/utxo-lib';
import { Psbt } from '@trezor/utxo-lib';

import { parseOutputScript } from './outputs';
import { getHDPath, getOutputScriptType, getScriptType } from '../../utils/pathUtils';

type ParsePsbtParams = {
    psbtTransactionData: string;
    network: Network;
    addresses: AccountAddresses;
    utxos: AccountUtxo[];
};

export const parsePsbt = ({
    psbtTransactionData,
    network,
    addresses,
    utxos,
}: ParsePsbtParams): PrecomposeResultFinal => {
    const psbt = Psbt.fromHex(psbtTransactionData, { network });

    const inputs: PROTO.TxInputType[] = [];
    const outputs: PROTO.TxOutputType[] = [];

    let totalSpent = BigInt(0);
    let sumOfInputs = BigInt(0);
    let sumOfOutputs = BigInt(0);

    for (const [index, input] of psbt.unsignedTx.ins.entries()) {
        const txid = bufferUtils.reverseBuffer(input.hash).toString('hex');
        const utxo = utxos.find(u => u.vout === input.index && u.txid === txid);
        if (!utxo) {
            // TODO: external utxo
            throw TypedError('Method_InvalidParameter', `parsePsbt: Utxo [${index}] not found`);
        }

        const address_n = getHDPath(utxo.path);
        inputs.push({
            prev_hash: utxo.txid,
            prev_index: input.index,
            amount: utxo.amount,
            address_n,
            script_type: getScriptType(address_n),
            sequence: input.sequence,
        });

        sumOfInputs += BigInt(utxo.amount);
    }

    const knownAddresses = addresses.used.concat(addresses.unused).concat(addresses.change);

    for (const [index, output] of psbt.unsignedTx.outs.entries()) {
        const outputScript = parseOutputScript(output.script, network);
        if (outputScript.type === 'address') {
            const changeAddress = knownAddresses.find(a => a.address === outputScript.address);
            if (changeAddress) {
                const address_n = getHDPath(changeAddress.path);
                outputs.push({
                    script_type: getOutputScriptType(address_n),
                    address_n,
                    amount: output.value,
                });
            } else {
                outputs.push({
                    script_type: 'PAYTOADDRESS',
                    address: outputScript.address,
                    amount: output.value,
                });
                totalSpent += BigInt(output.value);
            }

            sumOfOutputs += BigInt(output.value);
        } else if (outputScript.type === 'data') {
            if (typeof outputScript.data !== 'string') {
                throw TypedError(
                    'Method_InvalidParameter',
                    `parsePsbt: Invalid op_return_data at [${index}]`,
                );
            }
            outputs.push({
                script_type: 'PAYTOOPRETURN',
                amount: '0',
                op_return_data: outputScript.data,
            });
            totalSpent += BigInt(output.value);
            sumOfOutputs += BigInt(output.value);
        } else {
            throw TypedError(
                'Method_InvalidParameter',
                `parsePsbt: Unknown output type at [${index}]`,
            );
        }
    }

    const fee = sumOfInputs - sumOfOutputs;
    const bytes = psbt.unsignedTx.virtualSize();
    const feePerByte = Number(fee) / bytes;

    return {
        type: 'final',
        totalSpent: (totalSpent + fee).toString(),
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        inputs,
        outputs,
        outputsPermutation: [],
    };
};
