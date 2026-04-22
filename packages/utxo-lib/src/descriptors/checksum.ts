// https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki#checksum

const INPUT_CHARSET =
    '0123456789()[],\'/*abcdefgh@:$%{}IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~ijklmnopqrstuvwxyzABCDEFGH`#"\\ ';
const CHECKSUM_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0xf5dee51989n, 0xa9fdca3312n, 0x1bab10e32dn, 0x3706b1677an, 0x644d626ffdn];

/** Internal: computes the descriptor checksum polymod over a symbol sequence. */
const descsumsPolymod = (symbols: bigint[]): bigint => {
    let chk = 1n;
    for (const value of symbols) {
        const top = chk >> 35n;
        chk = ((chk & 0x7ffffffffn) << 5n) ^ value;
        for (let i = 0; i < 5; i++) {
            chk ^= (top >> BigInt(i)) & 1n ? GENERATOR[i] : 0n;
        }
    }

    return chk;
};

/** Internal: expands a descriptor string into its symbol sequence. Returns null for invalid chars. */
const descsumsExpand = (s: string): bigint[] | null => {
    const groups: number[] = [];
    const symbols: bigint[] = [];
    for (const c of s) {
        const v = INPUT_CHARSET.indexOf(c);
        if (v === -1) return null;
        symbols.push(BigInt(v & 31));
        groups.push(v >> 5);
        if (groups.length === 3) {
            symbols.push(BigInt(groups[0] * 9 + groups[1] * 3 + groups[2]));
            groups.length = 0;
        }
    }
    if (groups.length === 1) symbols.push(BigInt(groups[0]));
    else if (groups.length === 2) symbols.push(BigInt(groups[0] * 3 + groups[1]));

    return symbols;
};

/**
 * Computes the 8-character BIP-380 checksum for a descriptor string (without '#' prefix).
 * Throws if the descriptor contains characters outside the allowed charset.
 */
export const getDescriptorChecksum = (desc: string): string => {
    const symbols = descsumsExpand(desc);
    if (symbols === null) throw new Error(`Invalid character in descriptor: ${desc}`);

    const checksum = descsumsPolymod([...symbols, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]) ^ 1n;

    return Array.from(
        { length: 8 },
        (_, i) => CHECKSUM_CHARSET[Number((checksum >> BigInt(5 * (7 - i))) & 31n)],
    ).join('');
};

/**
 * Appends a `#<checksum>` suffix to a descriptor string, as defined by BIP-380.
 * Throws if the descriptor contains characters outside the allowed charset.
 */
export const addDescriptorChecksum = (desc: string): string =>
    `${desc}#${getDescriptorChecksum(desc)}`;

/**
 * Verifies that the checksum appended to a descriptor string is correct.
 * Expects the format `<desc>#<8-char-checksum>`.
 */
export const verifyDescriptorChecksum = (s: string): boolean => {
    if (s[s.length - 9] !== '#') return false;
    const checksumStr = s.slice(-8);
    if (!checksumStr.split('').every(c => CHECKSUM_CHARSET.includes(c))) return false;
    const symbols = descsumsExpand(s.slice(0, -9));
    if (symbols === null) return false;
    const checksumSymbols = [
        ...symbols,
        ...checksumStr.split('').map(c => BigInt(CHECKSUM_CHARSET.indexOf(c))),
    ];

    return descsumsPolymod(checksumSymbols) === 1n;
};
