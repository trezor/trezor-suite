import {
    bufferutils,
    networks,
    address as baddress,
    script as bscript,
    payments,
} from '@trezor/utxo-lib';

import {
    CoinjoinStateEvent,
    CoinjoinInput,
    CoinjoinOutput,
    CoinjoinOutputAddedEvent,
    AllowedScriptTypes,
} from '../types/coordinator';
import { Credentials } from '../types/middleware';

export const getRandomDelay = (min: number, max: number) =>
    Math.round(Math.random() * (max - min) + min);

export const getEvents = <T extends CoinjoinStateEvent['Type']>(
    type: T,
    events: CoinjoinStateEvent[],
) => events.filter(e => e.Type === type) as Extract<CoinjoinStateEvent, { Type: T }>[];

export const getCommitmentData = (identifier: string, roundId: string) => {
    const name = Buffer.from(identifier);
    const len = Buffer.allocUnsafe(1);
    len.writeUInt8(name.length, 0);
    return Buffer.concat([len, name, Buffer.from(roundId, 'hex')]).toString('hex');
};

// export const getOutpoint = (utxo: AccountUtxo) => {
//     const buf = Buffer.allocUnsafe(36);
//     const b = new bufferutils.BufferWriter(buf);
//     b.writeSlice(bufferutils.reverseBuffer(Buffer.from(utxo.txid, 'hex')));
//     b.writeUInt32(utxo.vout);
//     return buf.toString('hex');
// };

export const getScriptPubKey = (address: string, scriptType: AllowedScriptTypes) => {
    // OP_1: 51
    const scriptPubKey =
        scriptType === 'Taproot'
            ? `1 ${payments
                  .p2tr({
                      address,
                      network: networks.regtest,
                  })
                  .hash?.toString('hex')}`
            : `0 ${payments
                  .p2wpkh({
                      address,
                      network: networks.regtest,
                  })
                  .hash?.toString('hex')}`;
    return scriptPubKey;
};

export const compareOutpoint = (a: string, b: string) =>
    Buffer.from(a, 'hex').compare(Buffer.from(b, 'hex')) === 0;

export const sumCredentials = (c: Credentials[]) => c[0].value + c[1].value;

export const getInputSize = (type: AllowedScriptTypes) => {
    if (type === 'Taproot') return 58;
    if (type === 'P2WPKH') return 68;
    return 0;
};

export const getOutputSize = (type: AllowedScriptTypes) => {
    if (type === 'Taproot') return 43;
    if (type === 'P2WPKH') return 31;
    return 0;
};

export const prefixScriptPubKey = (scriptPubKey: string) => {
    const [OP, hash] = scriptPubKey.split(' ');
    return bscript.fromASM(`OP_${OP} ${hash}`).toString('hex');
};

export const addressFromScriptPubKey = (scriptPubKey: string) => {
    const [OP, hash] = scriptPubKey.split(' ');
    const script = bscript.fromASM(`OP_${OP} ${hash}`);
    return baddress.fromOutputScript(script, networks.regtest);
};

export const getScriptTypeFromPubKey = (scriptPubKey: string) => {
    const [OP] = scriptPubKey.split(' ');
    switch (OP) {
        case '0':
            return 'P2WPKH';
        case '1':
            return 'Taproot';
        default:
            return 'P2WPKH'; // TODO: throw error?
    }
};

export const getExternalOutputSize = (scriptPubKey: string) => {
    const type = getScriptTypeFromPubKey(scriptPubKey);
    return getOutputSize(type);
};

export const getExternalOutputAddress = (scriptPubKey: string) => {
    const [OP, hash] = scriptPubKey.split(' ');
    const script = bscript.fromASM(`OP_${OP} ${hash}`);
    return baddress.fromOutputScript(script, networks.regtest);
};

export const readOutpoint = (outpoint: string) => {
    const buf = Buffer.from(outpoint, 'hex');
    const b = new bufferutils.BufferReader(buf);
    const hash = bufferutils.reverseBuffer(b.readSlice(32)).toString('hex');
    const index = b.readUInt32();
    return { index, hash };
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
export const sortInputs = (a: CoinjoinInput, b: CoinjoinInput) => {
    if (a.txOut.value === b.txOut.value) {
        return compareByteArray(Buffer.from(a.outpoint), Buffer.from(b.outpoint));
    }

    return b.txOut.value - a.txOut.value;
};

// WalletWasabi/WalletWasabi/WabiSabi/Models/MultipartyTransaction/SigningState.cs
export const sortOutputs = (a: CoinjoinOutput, b: CoinjoinOutput) => {
    if (a.value === b.value)
        return compareByteArray(Buffer.from(a.scriptPubKey), Buffer.from(b.scriptPubKey));
    return b.value - a.value;
};

// WalletWasabi/WalletWasabi/WabiSabi/Models/MultipartyTransaction/SigningState.cs
// merge outputs with the same scriptPubKey's
export const mergePubkeys = (outputs: CoinjoinOutputAddedEvent[]) =>
    outputs.reduce((a, item) => {
        const duplicates = outputs.filter(o => o.output.scriptPubKey === item.output.scriptPubKey);
        if (duplicates.length > 1) {
            if (a.find(o => o.output.scriptPubKey === item.output.scriptPubKey)) return a;
            const value = duplicates.reduce((v, b) => v + b.output.value, 0);
            return a.concat({ ...item, output: { ...item.output, value } });
        }
        return a.concat(item);
    }, [] as CoinjoinOutputAddedEvent[]);
