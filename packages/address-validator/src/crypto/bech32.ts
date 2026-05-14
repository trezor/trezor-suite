import { bech32, bech32m } from '@scure/base';

function convertbits(
    data: number[] | Uint8Array,
    frombits: number,
    tobits: number,
    pad: boolean,
): number[] | null {
    let acc = 0;
    let bits = 0;
    const ret: number[] = [];
    const maxv = (1 << tobits) - 1;
    for (let p = 0; p < data.length; ++p) {
        const value = data[p];
        if (value < 0 || value >> frombits !== 0) {
            return null;
        }
        acc = (acc << frombits) | value;
        bits += frombits;
        while (bits >= tobits) {
            bits -= tobits;
            ret.push((acc >> bits) & maxv);
        }
    }
    if (pad) {
        if (bits > 0) {
            ret.push((acc << (tobits - bits)) & maxv);
        }
    } else if (bits >= frombits || (acc << (tobits - bits)) & maxv) {
        return null;
    }

    return ret;
}

export interface Bech32Decoded {
    version: number;
    program: number[];
}

export function decode(hrp: string, addr: string, m = false): Bech32Decoded | null {
    let dec;
    try {
        if (m) {
            dec = bech32m.decode(addr as `${string}1${string}`);
        } else {
            dec = bech32.decode(addr as `${string}1${string}`);
        }
    } catch {
        return null;
    }
    if (dec === null || dec.prefix !== hrp || dec.words.length < 1 || dec.words[0] > 16) {
        return null;
    }
    const res = convertbits(dec.words.slice(1), 5, 8, false);
    if (res === null || res.length < 2 || res.length > 40) {
        return null;
    }

    return { version: dec.words[0], program: res };
}

export function encode(
    hrp: string,
    version: number,
    program: number[] | Uint8Array,
    m = false,
): string | null {
    const bits = convertbits(program, 8, 5, true);
    if (bits === null) return null;
    const ret = m
        ? bech32m.encode(hrp, [version].concat(bits))
        : bech32.encode(hrp, [version].concat(bits));
    if (decode(hrp, ret, m) === null) {
        return null;
    }

    return ret;
}
