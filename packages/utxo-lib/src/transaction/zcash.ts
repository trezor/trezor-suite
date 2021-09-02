// https://zips.z.cash/zip-0243

import * as varuint from 'varuint-bitcoin';
import { BufferReader, BufferWriter, varIntSize } from '../bufferutils';
import { TransactionBase, TransactionOptions, varSliceSize, EMPTY_SCRIPT } from './base';

const ZCASH_JOINSPLITS_SUPPORT_VERSION = 2;
const ZCASH_OVERWINTER_VERSION = 3;
const ZCASH_SAPLING_VERSION = 4;

const ZCASH_NUM_JOINSPLITS_INPUTS = 2;
const ZCASH_NUM_JOINSPLITS_OUTPUTS = 2;
const ZCASH_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16;

const ZCASH_G1_PREFIX_MASK = 0x02;
const ZCASH_G2_PREFIX_MASK = 0x0a;

export interface ZcashCompressedG {
    x: Buffer;
    yLsb: number;
}

export interface ZcashSaplingZKProof {
    type: 'sapling';
    sA: Buffer;
    sB: Buffer;
    sC: Buffer;
}

export interface ZcashJoinSplitZKProof {
    type: 'joinsplit';
    gA: ZcashCompressedG;
    gAPrime: ZcashCompressedG;
    gB: ZcashCompressedG;
    gBPrime: ZcashCompressedG;
    gC: ZcashCompressedG;
    gCPrime: ZcashCompressedG;
    gK: ZcashCompressedG;
    gH: ZcashCompressedG;
}

export interface ZcashJoinSplits {
    vpubOld: number;
    vpubNew: number;
    anchor: Buffer;
    nullifiers: Buffer[];
    commitments: Buffer[];
    ephemeralKey: Buffer;
    randomSeed: Buffer;
    macs: Buffer[];
    zkproof: ZcashSaplingZKProof | ZcashJoinSplitZKProof;
    ciphertexts: Buffer[];
}

export interface ZcashVShieldedSpend {
    cv: Buffer;
    anchor: Buffer;
    nullifier: Buffer;
    rk: Buffer;
    zkproof: ZcashSaplingZKProof;
    spendAuthSig: Buffer;
}

export interface ZcashVShieldedOutput {
    cv: Buffer;
    cmu: Buffer;
    ephemeralKey: Buffer;
    encCiphertext: Buffer;
    outCiphertext: Buffer;
    zkproof: ZcashSaplingZKProof;
}

export interface ZcashSpecific {
    type: 'zcash';
    // ZCash version >= 2
    joinsplits: ZcashJoinSplits[];
    joinsplitPubkey: Buffer;
    joinsplitSig: Buffer;
    // ZCash version >= 3
    overwintered: number; // 1 if the transaction is post overwinter upgrade, 0 otherwise
    versionGroupId: number; // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
    // ZCash version >= 4
    valueBalance: number;
    vShieldedSpend: ZcashVShieldedSpend[];
    vShieldedOutput: ZcashVShieldedOutput[];
    bindingSig: Buffer;
}

function byteLength(tx: TransactionBase<ZcashSpecific>) {
    const overwinterSize =
        tx.version >= ZCASH_OVERWINTER_VERSION
            ? 4 + // nVersionGroupId
              4 // nExpiryHeight
            : 0;

    const txSpecific = tx.specific!;

    // Both pre and post Sapling JoinSplits are encoded with the following data:
    // 8 vpub_old, 8 vpub_new, 32 anchor, joinSplitsLen * 32 nullifiers, joinSplitsLen * 32 commitments, 32 ephemeralKey
    // 32 ephemeralKey, 32 randomSeed, joinsplit.macs.length * 32 vmacs
    const getJoinSplitsSize = () => {
        if (tx.version < ZCASH_JOINSPLITS_SUPPORT_VERSION) return 0;
        const joinSplitsLen = txSpecific.joinsplits.length;
        if (joinSplitsLen < 1) return varIntSize(joinSplitsLen);
        return (
            varIntSize(joinSplitsLen) +
            (tx.version >= ZCASH_SAPLING_VERSION ? 1698 * joinSplitsLen : 1802 * joinSplitsLen) + // vJoinSplit using JSDescriptionGroth16 (sapling) or JSDescriptionPHGR13 (pre sapling)
            32 + // joinSplitPubKey
            64 // joinSplitSig
        );
    };

    const saplingSize =
        tx.version >= ZCASH_SAPLING_VERSION
            ? 8 + // valueBalance
              varuint.encodingLength(txSpecific.vShieldedSpend.length) + // nShieldedSpend
              384 * txSpecific.vShieldedSpend.length + // vShieldedSpend
              varuint.encodingLength(txSpecific.vShieldedOutput.length) + // nShieldedOutput
              948 * txSpecific.vShieldedOutput.length + // vShieldedOutput
              (txSpecific.vShieldedSpend.length + txSpecific.vShieldedOutput.length > 0 ? 64 : 0) // bindingSig
            : 0;

    return (
        4 + // header
        varuint.encodingLength(tx.ins.length) + // inputs count
        varuint.encodingLength(tx.outs.length) + // outputs count
        tx.ins.reduce((sum, input) => sum + 40 + varSliceSize(input.script), 0) + // inputs
        tx.outs.reduce((sum, output) => sum + 8 + varSliceSize(output.script), 0) + // outputs
        4 + // locktime
        overwinterSize +
        getJoinSplitsSize() +
        saplingSize
    );
}

function toBuffer(tx: TransactionBase<ZcashSpecific>, buffer?: Buffer, initialOffset?: number) {
    if (!buffer) buffer = Buffer.allocUnsafe(byteLength(tx));

    const bufferWriter = new BufferWriter(buffer, initialOffset || 0);
    const txSpecific = tx.specific!;

    if (tx.version >= ZCASH_OVERWINTER_VERSION) {
        const mask = txSpecific.overwintered ? 1 : 0;
        bufferWriter.writeInt32(tx.version | (mask << 31)); // Set overwinter bit
        bufferWriter.writeUInt32(txSpecific.versionGroupId);
    } else {
        bufferWriter.writeInt32(tx.version);
    }

    bufferWriter.writeVarInt(tx.ins.length);
    tx.ins.forEach(txIn => {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
        bufferWriter.writeVarSlice(txIn.script);
        bufferWriter.writeUInt32(txIn.sequence);
    });

    bufferWriter.writeVarInt(tx.outs.length);
    tx.outs.forEach(txOut => {
        bufferWriter.writeUInt64(txOut.value);
        bufferWriter.writeVarSlice(txOut.script);
    });

    bufferWriter.writeUInt32(tx.locktime);

    if (tx.version >= ZCASH_OVERWINTER_VERSION) {
        bufferWriter.writeUInt32(tx.expiry!);
    }

    if (tx.version >= ZCASH_SAPLING_VERSION) {
        bufferWriter.writeInt64(txSpecific.valueBalance);

        bufferWriter.writeVarInt(txSpecific.vShieldedSpend.length);
        txSpecific.vShieldedSpend.forEach(shieldedSpend => {
            bufferWriter.writeSlice(shieldedSpend.cv);
            bufferWriter.writeSlice(shieldedSpend.anchor);
            bufferWriter.writeSlice(shieldedSpend.nullifier);
            bufferWriter.writeSlice(shieldedSpend.rk);
            bufferWriter.writeSlice(shieldedSpend.zkproof.sA);
            bufferWriter.writeSlice(shieldedSpend.zkproof.sB);
            bufferWriter.writeSlice(shieldedSpend.zkproof.sC);
            bufferWriter.writeSlice(shieldedSpend.spendAuthSig);
        });
        bufferWriter.writeVarInt(txSpecific.vShieldedOutput.length);
        txSpecific.vShieldedOutput.forEach(shieldedOutput => {
            bufferWriter.writeSlice(shieldedOutput.cv);
            bufferWriter.writeSlice(shieldedOutput.cmu);
            bufferWriter.writeSlice(shieldedOutput.ephemeralKey);
            bufferWriter.writeSlice(shieldedOutput.encCiphertext);
            bufferWriter.writeSlice(shieldedOutput.outCiphertext);
            bufferWriter.writeSlice(shieldedOutput.zkproof.sA);
            bufferWriter.writeSlice(shieldedOutput.zkproof.sB);
            bufferWriter.writeSlice(shieldedOutput.zkproof.sC);
        });
    }

    function writeCompressedG1(i: ZcashCompressedG) {
        bufferWriter.writeUInt8(ZCASH_G1_PREFIX_MASK | i.yLsb);
        bufferWriter.writeSlice(i.x);
    }

    function writeCompressedG2(i: ZcashCompressedG) {
        bufferWriter.writeUInt8(ZCASH_G2_PREFIX_MASK | i.yLsb);
        bufferWriter.writeSlice(i.x);
    }

    if (tx.version >= ZCASH_JOINSPLITS_SUPPORT_VERSION) {
        bufferWriter.writeVarInt(txSpecific.joinsplits.length);

        txSpecific.joinsplits.forEach(joinsplit => {
            bufferWriter.writeUInt64(joinsplit.vpubOld);
            bufferWriter.writeUInt64(joinsplit.vpubNew);
            bufferWriter.writeSlice(joinsplit.anchor);
            joinsplit.nullifiers.forEach(nullifier => {
                bufferWriter.writeSlice(nullifier);
            });
            joinsplit.commitments.forEach(nullifier => {
                bufferWriter.writeSlice(nullifier);
            });
            bufferWriter.writeSlice(joinsplit.ephemeralKey);
            bufferWriter.writeSlice(joinsplit.randomSeed);
            joinsplit.macs.forEach(nullifier => {
                bufferWriter.writeSlice(nullifier);
            });
            if (joinsplit.zkproof.type === 'sapling') {
                bufferWriter.writeSlice(joinsplit.zkproof.sA);
                bufferWriter.writeSlice(joinsplit.zkproof.sB);
                bufferWriter.writeSlice(joinsplit.zkproof.sC);
            } else {
                writeCompressedG1(joinsplit.zkproof.gA);
                writeCompressedG1(joinsplit.zkproof.gAPrime);
                writeCompressedG2(joinsplit.zkproof.gB);
                writeCompressedG1(joinsplit.zkproof.gBPrime);
                writeCompressedG1(joinsplit.zkproof.gC);
                writeCompressedG1(joinsplit.zkproof.gCPrime);
                writeCompressedG1(joinsplit.zkproof.gK);
                writeCompressedG1(joinsplit.zkproof.gH);
            }
            joinsplit.ciphertexts.forEach(ciphertext => {
                bufferWriter.writeSlice(ciphertext);
            });
        });
        if (txSpecific.joinsplits.length > 0) {
            bufferWriter.writeSlice(txSpecific.joinsplitPubkey);
            bufferWriter.writeSlice(txSpecific.joinsplitSig);
        }
    }

    if (
        tx.version >= ZCASH_SAPLING_VERSION &&
        txSpecific.vShieldedSpend.length + txSpecific.vShieldedOutput.length > 0
    ) {
        bufferWriter.writeSlice(txSpecific.bindingSig);
    }

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return buffer.slice(initialOffset, bufferWriter.offset);
    return buffer;
}

// Override TransactionBase.getExtraData
function getExtraData(tx: TransactionBase<ZcashSpecific>) {
    if (tx.version < ZCASH_JOINSPLITS_SUPPORT_VERSION) return;
    const offset =
        4 + // header
        (tx.version >= ZCASH_OVERWINTER_VERSION ? 8 : 0) + // 4 for nVersionGroupId and nExpiryHeight
        varuint.encodingLength(tx.ins.length) + // inputs count
        varuint.encodingLength(tx.outs.length) + // outputs count
        tx.ins.reduce((sum, input) => sum + 40 + varSliceSize(input.script), 0) + // inputs
        tx.outs.reduce((sum, output) => sum + 8 + varSliceSize(output.script), 0) + // outputs
        4; // locktime
    return tx.toBuffer().slice(offset);
}

export function fromConstructor(options: TransactionOptions) {
    const tx = new TransactionBase<ZcashSpecific>(options);
    // initialize specific data
    tx.specific = tx.specific || {
        type: 'zcash',
        joinsplits: [],
        joinsplitPubkey: EMPTY_SCRIPT,
        joinsplitSig: EMPTY_SCRIPT,
        overwintered: 0,
        versionGroupId: 0,
        valueBalance: 0,
        vShieldedSpend: [],
        vShieldedOutput: [],
        bindingSig: EMPTY_SCRIPT,
    };
    // override base methods
    tx.byteLength = byteLength.bind(null, tx);
    tx.toBuffer = toBuffer.bind(null, tx);
    tx.getExtraData = getExtraData.bind(null, tx);
    return tx;
}

export function fromBuffer(buffer: Buffer, options: TransactionOptions) {
    const bufferReader = new BufferReader(buffer);

    const tx = fromConstructor(options);
    const txSpecific = tx.specific!;
    tx.version = bufferReader.readInt32();

    txSpecific.overwintered = tx.version >>> 31; // Must be 1 for version 3 and up
    tx.version &= 0x07fffffff; // 3 for overwinter
    if (typeof tx.network.consensusBranchId?.[tx.version] !== 'number') {
        throw new Error('Unsupported Zcash transaction');
    }

    if (tx.version >= ZCASH_OVERWINTER_VERSION) {
        txSpecific.versionGroupId = bufferReader.readUInt32();
    }

    const vinLen = bufferReader.readVarInt();
    for (let i = 0; i < vinLen; ++i) {
        tx.ins.push({
            hash: bufferReader.readSlice(32),
            index: bufferReader.readUInt32(),
            script: bufferReader.readVarSlice(),
            sequence: bufferReader.readUInt32(),
            witness: [],
        });
    }

    const voutLen = bufferReader.readVarInt();
    for (let i = 0; i < voutLen; ++i) {
        tx.outs.push({
            value: bufferReader.readUInt64String(),
            script: bufferReader.readVarSlice(),
        });
    }

    tx.locktime = bufferReader.readUInt32();
    tx.expiry = tx.version >= ZCASH_OVERWINTER_VERSION ? bufferReader.readUInt32() : 0;

    function readCompressedG1() {
        const yLsb = bufferReader.readUInt8() & 1;
        const x = bufferReader.readSlice(32);
        return {
            x,
            yLsb,
        };
    }

    function readCompressedG2() {
        const yLsb = bufferReader.readUInt8() & 1;
        const x = bufferReader.readSlice(64);
        return {
            x,
            yLsb,
        };
    }

    function readSaplingZKProof(): ZcashSaplingZKProof {
        return {
            type: 'sapling',
            sA: bufferReader.readSlice(48),
            sB: bufferReader.readSlice(96),
            sC: bufferReader.readSlice(48),
        };
    }

    function readZKProof(): ZcashSaplingZKProof | ZcashJoinSplitZKProof {
        if (tx.version >= ZCASH_SAPLING_VERSION) {
            return readSaplingZKProof();
        }
        return {
            type: 'joinsplit',
            gA: readCompressedG1(),
            gAPrime: readCompressedG1(),
            gB: readCompressedG2(),
            gBPrime: readCompressedG1(),
            gC: readCompressedG1(),
            gCPrime: readCompressedG1(),
            gK: readCompressedG1(),
            gH: readCompressedG1(),
        };
    }

    if (tx.version >= ZCASH_SAPLING_VERSION) {
        txSpecific.valueBalance = bufferReader.readInt64();
        const nShieldedSpend = bufferReader.readVarInt();
        for (let i = 0; i < nShieldedSpend; ++i) {
            txSpecific.vShieldedSpend.push({
                cv: bufferReader.readSlice(32),
                anchor: bufferReader.readSlice(32),
                nullifier: bufferReader.readSlice(32),
                rk: bufferReader.readSlice(32),
                zkproof: readSaplingZKProof(),
                spendAuthSig: bufferReader.readSlice(64),
            });
        }

        const nShieldedOutput = bufferReader.readVarInt();
        for (let i = 0; i < nShieldedOutput; ++i) {
            txSpecific.vShieldedOutput.push({
                cv: bufferReader.readSlice(32),
                cmu: bufferReader.readSlice(32),
                ephemeralKey: bufferReader.readSlice(32),
                encCiphertext: bufferReader.readSlice(580),
                outCiphertext: bufferReader.readSlice(80),
                zkproof: readSaplingZKProof(),
            });
        }
    }

    if (tx.version >= ZCASH_JOINSPLITS_SUPPORT_VERSION) {
        const joinSplitsLen = bufferReader.readVarInt();
        for (let i = 0; i < joinSplitsLen; ++i) {
            let j: number;
            const vpubOld = bufferReader.readUInt64();
            const vpubNew = bufferReader.readUInt64();
            const anchor = bufferReader.readSlice(32);
            const nullifiers: Buffer[] = [];
            for (j = 0; j < ZCASH_NUM_JOINSPLITS_INPUTS; j++) {
                nullifiers.push(bufferReader.readSlice(32));
            }
            const commitments: Buffer[] = [];
            for (j = 0; j < ZCASH_NUM_JOINSPLITS_OUTPUTS; j++) {
                commitments.push(bufferReader.readSlice(32));
            }
            const ephemeralKey = bufferReader.readSlice(32);
            const randomSeed = bufferReader.readSlice(32);
            const macs: Buffer[] = [];
            for (j = 0; j < ZCASH_NUM_JOINSPLITS_INPUTS; j++) {
                macs.push(bufferReader.readSlice(32));
            }

            const zkproof = readZKProof();
            const ciphertexts: Buffer[] = [];
            for (j = 0; j < ZCASH_NUM_JOINSPLITS_OUTPUTS; j++) {
                ciphertexts.push(bufferReader.readSlice(ZCASH_NOTECIPHERTEXT_SIZE));
            }

            txSpecific.joinsplits.push({
                vpubOld,
                vpubNew,
                anchor,
                nullifiers,
                commitments,
                ephemeralKey,
                randomSeed,
                macs,
                zkproof,
                ciphertexts,
            });
        }
        if (joinSplitsLen > 0) {
            txSpecific.joinsplitPubkey = bufferReader.readSlice(32);
            txSpecific.joinsplitSig = bufferReader.readSlice(64);
        }
    }

    if (
        tx.version >= ZCASH_SAPLING_VERSION &&
        txSpecific.vShieldedSpend.length + txSpecific.vShieldedOutput.length > 0
    ) {
        txSpecific.bindingSig = bufferReader.readSlice(64);
    }

    if (options.nostrict) return tx;
    if (bufferReader.offset !== buffer.length) throw new Error('Transaction has unexpected data');

    return tx;
}
