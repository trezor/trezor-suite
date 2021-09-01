/* eslint-disable no-continue */
import * as BNETWORKS from '../src/networks';
import * as bscript from '../src/script';

function tryHex(x: Buffer | Buffer[]): string | string[] {
    if (Buffer.isBuffer(x)) return x.toString('hex');
    if (Array.isArray(x)) return x.map(tryHex) as string[];
    return x;
}

function fromHex(x: string | string[]): Buffer | Buffer[] {
    if (typeof x === 'string') return Buffer.from(x, 'hex');
    if (Array.isArray(x)) return x.map(fromHex) as Buffer[];
    return x;
}

function tryASM(x: Buffer): string {
    if (Buffer.isBuffer(x)) return bscript.toASM(x);
    return x;
}

function asmToBuffer(x: string): Buffer {
    if (x === '') return Buffer.alloc(0);
    return bscript.fromASM(x);
}

function carryOver(a: any, b: any): void {
    // eslint-disable-next-line no-restricted-syntax
    for (const k in b) {
        if (!k) continue;
        if (k in a && k === 'redeem') {
            carryOver(a[k], b[k]);
            continue;
        }

        // don't, the value was specified
        if (k in a) continue;

        // otherwise, expect match
        a[k] = b[k];
    }
}

function equateBase(a: any, b: any, _context: string): void {
    if ('output' in b) expect(tryASM(a.output)).toEqual(tryASM(b.output));
    if ('input' in b) expect(tryASM(a.input)).toEqual(tryASM(b.input));
    if ('witness' in b) expect(tryHex(a.witness)).toEqual(tryHex(b.witness));
}

export function equate(a: any, b: any, args?: any): void {
    b = { ...b };
    carryOver(b, args);

    // by null, we mean 'undefined', but JSON
    if (b.input === null) b.input = undefined;
    if (b.output === null) b.output = undefined;
    if (b.witness === null) b.witness = undefined;
    if (b.redeem) {
        if (b.redeem.input === null) b.redeem.input = undefined;
        if (b.redeem.output === null) b.redeem.output = undefined;
        if (b.redeem.witness === null) b.redeem.witness = undefined;
    }

    equateBase(a, b, '');
    if (b.redeem) equateBase(a.redeem, b.redeem, 'redeem.');
    if (b.network) expect(a.network).toEqual((BNETWORKS as any)[b.network]);

    // contextual
    if (b.signature === null) b.signature = undefined;
    if (b.signatures === null) b.signatures = undefined;
    if ('address' in b) expect(a.address).toEqual(b.address);
    if ('name' in b) expect(a.name).toEqual(b.name);
    if ('hash' in b) expect(tryHex(a.hash)).toEqual(tryHex(b.hash));
    if ('pubkey' in b) expect(tryHex(a.pubkey)).toEqual(tryHex(b.pubkey));
    if ('signature' in b) expect(tryHex(a.signature)).toEqual(tryHex(b.signature));
    if ('m' in b) expect(a.m).toEqual(b.m);
    if ('n' in b) expect(a.n).toEqual(b.n);
    if ('pubkeys' in b) expect(tryHex(a.pubkeys)).toEqual(tryHex(b.pubkeys));
    if ('signatures' in b) expect(tryHex(a.signatures)).toEqual(tryHex(b.signatures));
    if ('data' in b) expect(tryHex(a.data)).toEqual(tryHex(b.data));
}

export function preform(x: any): any {
    x = { ...x };

    if (x.network) x.network = (BNETWORKS as any)[x.network];
    if (typeof x.inputHex === 'string') {
        x.input = Buffer.from(x.inputHex, 'hex');
        delete x.inputHex;
    }
    if (typeof x.outputHex === 'string') {
        x.output = Buffer.from(x.outputHex, 'hex');
        delete x.outputHex;
    }
    if (typeof x.output === 'string') x.output = asmToBuffer(x.output);
    if (typeof x.input === 'string') x.input = asmToBuffer(x.input);
    if (Array.isArray(x.witness)) x.witness = x.witness.map(fromHex);

    if (x.data) x.data = x.data.map(fromHex);
    if (x.hash) x.hash = Buffer.from(x.hash, 'hex');
    if (x.pubkey) x.pubkey = Buffer.from(x.pubkey, 'hex');
    if (x.signature) x.signature = Buffer.from(x.signature, 'hex');
    if (x.pubkeys) x.pubkeys = x.pubkeys.map(fromHex);
    if (x.signatures)
        x.signatures = x.signatures.map((y: any) =>
            Number.isFinite(y) ? y : Buffer.from(y, 'hex'),
        );
    if (x.redeem) {
        x.redeem = { ...x.redeem };
        if (typeof x.redeem.input === 'string') x.redeem.input = asmToBuffer(x.redeem.input);
        if (typeof x.redeem.output === 'string') x.redeem.output = asmToBuffer(x.redeem.output);
        if (Array.isArray(x.redeem.witness)) x.redeem.witness = x.redeem.witness.map(fromHex);
        if (x.redeem.network) x.redeem.network = (BNETWORKS as any)[x.redeem.network];
    }

    return x;
}

export function from(path: string, object: any, result?: any): any {
    const paths = path.split('.');
    result = result || {};

    let r = result;
    paths.forEach((k, i) => {
        if (i < paths.length - 1) {
            r[k] = r[k] || {};

            // recurse
            r = r[k];
            object = object[k];
        } else {
            r[k] = object[k];
        }
    });

    return result;
}
