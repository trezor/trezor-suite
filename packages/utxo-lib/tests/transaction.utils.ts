import { Transaction, TxOptions } from '../src/transaction';
import * as NETWORKS from '../src/networks';
import * as bscript from '../src/script';

const DEFAULT_SEQUENCE = 0xffffffff;
const EMPTY_SCRIPT = Buffer.allocUnsafe(0);

// keyof typeof NETWORKS;
// @ts-ignore expression of type string can't be used to index type
export const getNetwork = (name?: string) => (name ? NETWORKS[name] : undefined);
// export const getNetwork = (name?: string) => {
//     Object.keys(NETWORKS).forEach(network => {
//         Object.prototype.hasOwnProperty(network)
//         if (network)
//     })
// }

export const getVinVoutScript = (vinvout: { data?: string; script?: string }) => {
    if (vinvout.data) {
        return Buffer.from(vinvout.data, 'hex');
    }
    if (vinvout.script) {
        return bscript.fromASM(vinvout.script);
    }
    return EMPTY_SCRIPT;
};

type RawOptions = {
    noWitness?: boolean;
    network?: TxOptions['network'];
    txSpecific?: TxOptions['txSpecific'];
};

export type Fixture = {
    description: string;
    network?: string;
    id: string;
    hash: string;
    hex: string;
    whex?: string;
    weight: number;
    virtualSize: number;
    coinbase: boolean;
    raw: {
        version: number;
    };
};

export const fromRaw = (raw: any, options: RawOptions = {}) => {
    const tx = new Transaction(options);
    tx.version = raw.version;
    tx.locktime = raw.locktime;
    tx.ins = raw.ins.map((input: any) => ({
        index: input.index,
        hash: Buffer.from(input.hash, 'hex'),
        script: getVinVoutScript(input),
        sequence: input.sequence || DEFAULT_SEQUENCE,
        witness:
            !options.noWitness && input.witness
                ? input.witness.map((x: string) => Buffer.from(x, 'hex'))
                : [],
    }));
    tx.outs = raw.outs.map((output: any) => ({
        script: getVinVoutScript(output),
        value: output.value,
    }));
    return tx;
};

export const checkTx = (tx: ReturnType<typeof Transaction.fromHex>, raw: any) => {
    expect(tx.version).toEqual(raw.version);
    expect(tx.locktime).toEqual(raw.locktime);
    expect(tx.timestamp).toEqual(raw.timestamp);
    tx.ins.forEach((input, i) => {
        const expected = raw.ins[i];
        expect(input.hash.toString('hex')).toEqual(expected.hash);
        expect(input.index).toEqual(expected.index);
        expect(input.script.toString('hex')).toEqual(getVinVoutScript(expected).toString('hex'));
        expect(input.sequence).toEqual(expected.sequence || DEFAULT_SEQUENCE);
    });
    tx.outs.forEach((output, i) => {
        const expected = raw.outs[i];
        expect(output.value).toEqual(expected.value.toString());
        expect(output.script.toString('hex')).toEqual(getVinVoutScript(expected).toString('hex'));
    });
};
