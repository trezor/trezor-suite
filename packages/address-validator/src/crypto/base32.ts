const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function b32encode(input: string): string {
    const parts: string[] = [];
    let quanta = Math.floor(input.length / 5);
    const leftover = input.length % 5;

    if (leftover !== 0) {
        for (let i = 0; i < 5 - leftover; i++) {
            input += '\x00';
        }
        quanta += 1;
    }

    for (let i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(input.charCodeAt(i * 5) >> 3));
        parts.push(
            alphabet.charAt(
                ((input.charCodeAt(i * 5) & 0x07) << 2) | (input.charCodeAt(i * 5 + 1) >> 6),
            ),
        );
        parts.push(alphabet.charAt((input.charCodeAt(i * 5 + 1) & 0x3f) >> 1));
        parts.push(
            alphabet.charAt(
                ((input.charCodeAt(i * 5 + 1) & 0x01) << 4) | (input.charCodeAt(i * 5 + 2) >> 4),
            ),
        );
        parts.push(
            alphabet.charAt(
                ((input.charCodeAt(i * 5 + 2) & 0x0f) << 1) | (input.charCodeAt(i * 5 + 3) >> 7),
            ),
        );
        parts.push(alphabet.charAt((input.charCodeAt(i * 5 + 3) & 0x7f) >> 2));
        parts.push(
            alphabet.charAt(
                ((input.charCodeAt(i * 5 + 3) & 0x03) << 3) | (input.charCodeAt(i * 5 + 4) >> 5),
            ),
        );
        parts.push(alphabet.charAt(input.charCodeAt(i * 5 + 4) & 0x1f));
    }

    let replace = 0;
    if (leftover === 1) replace = 6;
    else if (leftover === 2) replace = 4;
    else if (leftover === 3) replace = 3;
    else if (leftover === 4) replace = 1;

    for (let i = 0; i < replace; i++) parts.pop();
    for (let i = 0; i < replace; i++) parts.push('=');

    return parts.join('');
}

export function b32decode(input: string): Uint8Array {
    const result = new ArrayBuffer((input.length * 5) / 8);
    const buffer = new Uint8Array(result);
    for (let j = 0; j < input.length / 8; j++) {
        const v = new Array<number>(8).fill(0);
        for (let i = 0; i < 8; ++i) {
            v[i] = alphabet.indexOf(input[j * 8 + i]);
        }
        const i = 0;
        buffer[j * 5 + 0] = (v[i + 0] << 3) | (v[i + 1] >> 2);
        buffer[j * 5 + 1] = ((v[i + 1] & 0x3) << 6) | (v[i + 2] << 1) | (v[i + 3] >> 4);
        buffer[j * 5 + 2] = ((v[i + 3] & 0xf) << 4) | (v[i + 4] >> 1);
        buffer[j * 5 + 3] = ((v[i + 4] & 0x1) << 7) | (v[i + 5] << 2) | (v[i + 6] >> 3);
        buffer[j * 5 + 4] = ((v[i + 6] & 0x7) << 5) | v[i + 7];
    }

    return buffer;
}
