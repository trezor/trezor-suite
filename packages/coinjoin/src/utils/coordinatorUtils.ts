import { bufferUtils } from '@trezor/utils';
import {
    payments,
    address as baddress,
    script as bscript,
    bufferutils as bUtils,
    Network,
} from '@trezor/utxo-lib';

import {
    AllowedScriptTypes,
    CoinjoinOutputAddedEvent,
    CoinjoinInput,
    CoinjoinOutput,
} from '../types/coordinator';

// WabiSabi coordinator is using custom format of address scriptPubKey
// utxo-lib format: `OP_0 {sha256(redeemScript)}`, `OP_1 {witnessProgram}`
// wabisabi format: `0 hash`, `1 hash`
export const getScriptPubKeyFromAddress = (
    address: string,
    network: Network,
    scriptType: AllowedScriptTypes,
) => {
    if (scriptType === 'P2WPKH') {
        return `0 ${payments
            .p2wpkh({
                address,
                network,
            })
            .hash?.toString('hex')}`;
    }

    if (scriptType === 'Taproot') {
        // OP_1: 51
        return `1 ${payments
            .p2tr({
                address,
                network,
            })
            .hash?.toString('hex')}`;
    }

    throw new Error('Unsupported scriptType');
};

// check WabiSabi.scriptPubKey format by OP and return AllowedScriptType
export const getScriptTypeFromScriptPubKey = (scriptPubKey: string): AllowedScriptTypes => {
    if (scriptPubKey.startsWith('0 ')) {
        return 'P2WPKH';
    }
    if (scriptPubKey.startsWith('1 ')) {
        return 'Taproot';
    }

    throw new Error('Unsupported scriptType');
};

// return WabiSabi.scriptPubKey in utxo-lib format (see getScriptPubKeyFromAddress)
// return as hex string or as buffer
export function prefixScriptPubKey(scriptPubKey: string, useHex?: boolean): string;
export function prefixScriptPubKey(scriptPubKey: string, useHex: false): Buffer;
export function prefixScriptPubKey(scriptPubKey: string, useHex = true) {
    const [OP, hash] = scriptPubKey.split(' ');
    const script = bscript.fromASM(`OP_${OP} ${hash}`);

    return useHex ? script.toString('hex') : script;
}

// return address from WabiSabi.scriptPubKey
export const getAddressFromScriptPubKey = (scriptPubKey: string, network: Network) => {
    const script = prefixScriptPubKey(scriptPubKey, false);

    return baddress.fromOutputScript(script, network);
};

// return WabiSabi coordinator config constants
export const getInputSize = (type: AllowedScriptTypes) => {
    if (type === 'Taproot') return 58;
    if (type === 'P2WPKH') return 68;
    throw new Error('Unsupported scriptType');
};

// return WabiSabi coordinator config constants
export const getOutputSize = (type: AllowedScriptTypes) => {
    if (type === 'Taproot') return 43;
    if (type === 'P2WPKH') return 31;
    throw new Error('Unsupported scriptType');
};

export const getExternalOutputSize = (scriptPubKey: string) => {
    const type = getScriptTypeFromScriptPubKey(scriptPubKey);

    return getOutputSize(type);
};

// read index, hash and txid from input `outpoint`
export const readOutpoint = (outpoint: string) => {
    const reader = new bUtils.BufferReader(Buffer.from(outpoint, 'hex'));
    const txid = reader.readSlice(32);
    const index = reader.readUInt32();
    const hash = bUtils.reverseBuffer(txid).toString('hex');

    return { index, hash, txid: txid.toString('hex') };
};

// WalletWasabi/WalletWasabi/Helpers/ByteArrayComparer.cs
const compareByteArray = (left: Buffer, right: Buffer) => {
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;

    const min = Math.min(left.length, right.length);
    for (let i = 0; i < min; i++) {
        if (left[i] < right[i]) return -1;
        if (left[i] > right[i]) return 1;
    }

    return left.length - right.length;
};

// WalletWasabi/WalletWasabi/WabiSabi/Models/MultipartyTransaction/SigningState.cs
// merge outputs with the same scriptPubKey's
export const mergePubkeys = (outputs: CoinjoinOutputAddedEvent[]) =>
    outputs.reduce((a, item) => {
        const duplicates = outputs.filter(o => o.Output.ScriptPubKey === item.Output.ScriptPubKey);
        if (duplicates.length > 1) {
            if (a.find(o => o.Output.ScriptPubKey === item.Output.ScriptPubKey)) return a;
            const Value = duplicates.reduce((v, b) => v + b.Output.Value, 0);

            return a.concat({ ...item, Output: { ...item.Output, Value } });
        }

        return a.concat(item);
    }, [] as CoinjoinOutputAddedEvent[]);

// WalletWasabi/WalletWasabi/WabiSabi/Models/MultipartyTransaction/SigningState.cs
export const sortInputs = (a: CoinjoinInput, b: CoinjoinInput) => {
    if (a.TxOut.Value === b.TxOut.Value) {
        return compareByteArray(Buffer.from(a.Outpoint), Buffer.from(b.Outpoint));
    }

    return b.TxOut.Value - a.TxOut.Value;
};

// WalletWasabi/WalletWasabi/WabiSabi/Models/MultipartyTransaction/SigningState.cs
export const sortOutputs = (a: CoinjoinOutput, b: CoinjoinOutput) => {
    if (a.Value === b.Value)
        return compareByteArray(Buffer.from(a.ScriptPubKey), Buffer.from(b.ScriptPubKey));

    return b.Value - a.Value;
};

// Transform transaction signature to witness, based on @trezor/utxo-lib/Transaction.getWitness
// bip-0141 format: chunks size + (chunk[i].size + chunk[i]),
export const getWitnessFromSignature = (signature: string) => {
    const chunks = [Buffer.from(signature, 'hex')]; // NOTE: Trezor signature = only one chunk
    const prefixedChunks = chunks.reduce(
        (arr, chunk) => arr.concat([bufferUtils.getChunkSize(chunk.length), chunk]),
        [bufferUtils.getChunkSize(chunks.length)],
    );

    return Buffer.concat(prefixedChunks).toString('hex');
};
