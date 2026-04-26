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
            v[i] = alphabet.indexOf(s[j * 8 + i]);
        }
        const i = 0;
        b[j * 5 + 0] = (v[i + 0] << 3) | (v[i + 1] >> 2);
        b[j * 5 + 1] = ((v[i + 1] & 0x3) << 6) | (v[i + 2] << 1) | (v[i + 3] >> 4);
        b[j * 5 + 2] = ((v[i + 3] & 0xf) << 4) | (v[i + 4] >> 1);
        b[j * 5 + 3] = ((v[i + 4] & 0x1) << 7) | (v[i + 5] << 2) | (v[i + 6] >> 3);
        b[j * 5 + 4] = ((v[i + 6] & 0x7) << 5) | v[i + 7];
    }

    return b;
};
