/* eslint-disable camelcase */

// This class is a 1:1 copy of trezor-firmware tx weight calculation.
// It is used to verify that compose process returns correct values in estimated tx virtual bytes.
// multisig and external is not used for now in therefore its not 100% done.
// https://github.com/trezor/trezor-firmware/blob/1fceca73da523c5bf2bb0f398c91e00c728bdbe0/core/src/apps/bitcoin/sign_tx/tx_weight.py
// https://github.com/trezor/trezor-firmware/blob/1fceca73da523c5bf2bb0f398c91e00c728bdbe0/core/tests/test_apps.bitcoin.txweight.py

import * as baddress from '../src/address';
import { OUTPUT_SCRIPT_LENGTH, TxType } from '../src/coinselect/utils';
import type { Network } from '../src';
import type { ComposeResult } from '../src/compose/result';

// transaction header size: 4 byte version
const _TXSIZE_HEADER = 4;
// transaction footer size: 4 byte lock time
const _TXSIZE_FOOTER = 4;
// transaction segwit overhead 2 (marker, flag)
const _TXSIZE_SEGWIT_OVERHEAD = 2;

// transaction input size (without script): 32 prevhash, 4 idx, 4 sequence
const _TXSIZE_INPUT = 40;
// transaction output size (without script): 8 amount
const _TXSIZE_OUTPUT = 8;
// size of a pubkey
const _TXSIZE_PUBKEY = 33;
// average size of a DER signature (3 type bytes, 3 len bytes, 33 R, 32 S, 1 sighash)
const _TXSIZE_DER_SIGNATURE = 72;
// size of a Schnorr signature (32 R, 32 S, no sighash)
const _TXSIZE_SCHNORR_SIGNATURE = 64;
// size of a multiscript without pubkey (1 M, 1 N, 1 checksig)
const _TXSIZE_MULTISIGSCRIPT = 3;
// size of a p2wpkh script (1 version, 1 push, 20 hash)
const _TXSIZE_WITNESSPKHASH = 22;
// size of a p2wsh script (1 version, 1 push, 32 hash)
const _TXSIZE_WITNESSSCRIPT = 34;

const SCRIPT_TYPES = {
    p2pkh: 'SPENDADDRESS',
    p2sh: 'SPENDP2SHWITNESS',
    p2tr: 'SPENDTAPROOT',
    p2wpkh: 'SPENDWITNESS',
};

const SEGWIT_INPUT_SCRIPT_TYPES = ['SPENDP2SHWITNESS', 'SPENDWITNESS', 'SPENDTAPROOT'];
const NONSEGWIT_INPUT_SCRIPT_TYPES = ['SPENDADDRESS', 'SPENDMULTISIG'];

function getVarIntSize(length: number) {
    if (length < 253) return 1;
    if (length < 65536) return 3;
    return 5;
}

function getOpPushSize(length: number) {
    if (length < 76) return 1;
    if (length < 256) return 2;
    if (length < 65536) return 3;
    return 5;
}

// protobuf.TxInputType
type Input = {
    script_type: string;
    multisig?: {
        // protobuf.MultisigRedeemScriptType
        nodes?: any[];
        pubkeys: any[];
        m: number;
    };
    witness?: Buffer[];
    ownership_proof?: any;
};

export class TxWeightCalculator {
    inputs_count = 0;
    outputs_count = 0;
    counter = 4 * (_TXSIZE_HEADER + _TXSIZE_FOOTER);
    segwit_inputs_count = 0;
    inputs: { length: number }[] = [];

    addInputByKey(type: keyof typeof SCRIPT_TYPES) {
        this.addInput({ script_type: SCRIPT_TYPES[type] });
    }

    addInput(input: Input) {
        this.inputs_count += 1;

        let input_script_size = 0;

        if (input.multisig) {
            if (input.script_type === 'SPENDTAPROOT') {
                throw new Error('Multisig not supported for Taproot yet');
            }
            const n = input.multisig.nodes
                ? input.multisig.nodes.length
                : input.multisig.pubkeys.length;
            let multisig_script_size = _TXSIZE_MULTISIGSCRIPT + n * (1 + _TXSIZE_PUBKEY);
            if (SEGWIT_INPUT_SCRIPT_TYPES.includes(input.script_type)) {
                multisig_script_size += getVarIntSize(multisig_script_size);
            } else {
                multisig_script_size += getOpPushSize(multisig_script_size);
                input_script_size =
                    1 + // the OP_FALSE bug in multisig
                    input.multisig.m * (1 + _TXSIZE_DER_SIGNATURE) +
                    multisig_script_size;
            }
        } else if (input.script_type === 'SPENDTAPROOT') {
            input_script_size = 1 + _TXSIZE_SCHNORR_SIGNATURE;
        } else {
            input_script_size = 1 + _TXSIZE_DER_SIGNATURE + 1 + _TXSIZE_PUBKEY;
        }

        this.counter += 4 * _TXSIZE_INPUT;

        if (NONSEGWIT_INPUT_SCRIPT_TYPES.includes(input.script_type)) {
            input_script_size += getVarIntSize(input_script_size);
            this.counter += 4 * input_script_size;
        } else if (SEGWIT_INPUT_SCRIPT_TYPES.includes(input.script_type)) {
            this.segwit_inputs_count += 1;
            if (input.script_type === 'SPENDP2SHWITNESS') {
                // add script_sig size
                if (input.multisig) {
                    this.counter += 4 * (2 + _TXSIZE_WITNESSSCRIPT);
                } else {
                    this.counter += 4 * (2 + _TXSIZE_WITNESSPKHASH);
                }
            } else {
                this.counter += 4; // empty script_sig (1 byte)
            }
            this.counter += 1 + input_script_size; // discounted witness
        } else if (input.script_type === 'EXTERNAL') {
            const witness_size = 0;
            const script_sig_size = 0;
            if (input.ownership_proof) {
                // TODO:
                // script_sig, witness = ownership.read_scriptsig_witness(
                //     i.ownership_proof
                // )
                // script_sig_size = len(script_sig)
                // witness_size = len(witness)
            } else {
                // script_sig_size = len(i.script_sig or b"")
                // witness_size = len(i.witness or b"")
            }

            if (witness_size > 1) {
                this.segwit_inputs_count += 1;
            }

            this.counter += 4 * (getVarIntSize(script_sig_size) + script_sig_size);
            this.counter += witness_size;
        } else {
            throw new Error('unknown input script_type');
        }

        this.inputs.push({ length: input_script_size });
    }

    addOutputByKey(key: keyof typeof OUTPUT_SCRIPT_LENGTH) {
        this.addOutput({ length: OUTPUT_SCRIPT_LENGTH[key] });
    }

    addOutput(script: { length: number }) {
        this.outputs_count += 1;
        const script_size = getVarIntSize(script.length) + script.length;
        this.counter += 4 * (_TXSIZE_OUTPUT + script_size);
    }

    getTotal() {
        let total = this.counter;
        total += 4 * getVarIntSize(this.inputs_count);
        total += 4 * getVarIntSize(this.outputs_count);
        if (this.segwit_inputs_count) {
            total += _TXSIZE_SEGWIT_OVERHEAD;
            // add one byte of witness stack item count per non-segwit input
            total += this.inputs_count - this.segwit_inputs_count;
        }

        return total;
    }

    getVirtualBytes() {
        return Math.ceil(this.getTotal() / 4);
    }
}

type FinalResult = Exclude<ComposeResult, { type: 'nonfinal' } | { type: 'error' }>;

export function verifyTxBytes(tx: FinalResult, txType: TxType = 'p2pkh', network?: Network) {
    const calc = new TxWeightCalculator();
    tx.transaction.inputs.forEach(() => {
        calc.addInputByKey(txType);
    });

    tx.transaction.outputs.sorted.forEach(out => {
        if (out.opReturnData) {
            calc.addOutput({ length: 2 + out.opReturnData.length });
        }
        if (out.address) {
            calc.addOutput({ length: baddress.toOutputScript(out.address, network).length });
        }
        if (out.path) {
            calc.addOutputByKey(txType); // change output
        }
    });

    expect(calc.getVirtualBytes()).toEqual(tx.bytes);
}
