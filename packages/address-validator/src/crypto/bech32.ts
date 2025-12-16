import { bech32, bech32m } from 'bech32';

function convertbits(
    data: number[],
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
    } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv) !== 0) {
        return null;
    }
    return ret;
}

export function decode(
    hrp: string,
    addr: string,
    useBech32m = false,
): { version: number; program: number[] } | null {
    let dec;
    try {
        dec = useBech32m ? bech32m.decode(addr) : bech32.decode(addr);
    } catch (err) {
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
    program: number[],
    useBech32m = false,
): string | null {
    const words = convertbits(program, 8, 5, true);
    if (!words) {
        return null;
    }
    const encoded = useBech32m
        ? bech32m.encode(hrp, [version].concat(words))
        : bech32.encode(hrp, [version].concat(words));
    return decode(hrp, encoded, useBech32m) === null ? null : encoded;
}
