const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode a string to base32
 */
export const b32encode = (s: string): string => {
    const parts: string[] = [];
    let quanta = Math.floor(s.length / 5);
    const leftover = s.length % 5;

    if (leftover !== 0) {
        for (let i = 0; i < 5 - leftover; i++) {
            s += '\x00';
        }
        quanta += 1;
    }

    for (let i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
        parts.push(
            alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6)),
        );
        parts.push(alphabet.charAt((s.charCodeAt(i * 5 + 1) & 0x3f) >> 1));
        parts.push(
            alphabet.charAt(
                ((s.charCodeAt(i * 5 + 1) & 0x01) << 4) | (s.charCodeAt(i * 5 + 2) >> 4),
            ),
        );
        parts.push(
            alphabet.charAt(
                ((s.charCodeAt(i * 5 + 2) & 0x0f) << 1) | (s.charCodeAt(i * 5 + 3) >> 7),
            ),
        );
        parts.push(alphabet.charAt((s.charCodeAt(i * 5 + 3) & 0x7f) >> 2));
        parts.push(
            alphabet.charAt(
                ((s.charCodeAt(i * 5 + 3) & 0x03) << 3) | (s.charCodeAt(i * 5 + 4) >> 5),
            ),
        );
        parts.push(alphabet.charAt(s.charCodeAt(i * 5 + 4) & 0x1f));
    }

    let replace = 0;
    if (leftover === 1) replace = 6;
    else if (leftover === 2) replace = 4;
    else if (leftover === 3) replace = 3;
    else if (leftover === 4) replace = 1;

    for (let i = 0; i < replace; i++) parts.pop();
    for (let i = 0; i < replace; i++) parts.push('=');

    return parts.join('');
};

/**
 * Decode a base32 string.
 * This is made specifically for our use, deals only with proper strings
 */
export const b32decode = (s: string): Uint8Array => {
    const r = new ArrayBuffer((s.length * 5) / 8);
    const b = new Uint8Array(r);
    for (let j = 0; j < s.length / 8; j++) {
        const v = [0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 8; ++i) {
            const sIndex = j * 8 + i;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const sChar: string = s[sIndex];
            v[i] = alphabet.indexOf(sChar);
        }
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v0: number = v[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v1: number = v[1];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v2: number = v[2];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v3: number = v[3];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v4: number = v[4];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v5: number = v[5];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v6: number = v[6];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v7: number = v[7];
        b[j * 5 + 0] = (v0 << 3) | (v1 >> 2);
        b[j * 5 + 1] = ((v1 & 0x3) << 6) | (v2 << 1) | (v3 >> 4);
        b[j * 5 + 2] = ((v3 & 0xf) << 4) | (v4 >> 1);
        b[j * 5 + 3] = ((v4 & 0x1) << 7) | (v5 << 2) | (v6 >> 3);
        b[j * 5 + 4] = ((v6 & 0x7) << 5) | v7;
    }

    return b;
};
