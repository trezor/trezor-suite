// Hex helpers for the Monero tx modules. Kept dependency-free so the serializer/marshaler can run
// in the worker, the renderer and Node alike.

export const bytesToHex = (bytes: Uint8Array): string => {
    let hex = '';
    for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, '0');
    }

    return hex;
};

export const hexToBytes = (hex: string): Uint8Array => {
    if (hex.length % 2 !== 0) {
        throw new Error('hex string has odd length');
    }
    // Number.parseInt is lenient (it accepts a trailing bad nibble, whitespace and signs), so a
    // single corrupted character could otherwise be silently mis-decoded on the relay path.
    if (hex.length > 0 && !/^[0-9a-fA-F]+$/.test(hex)) {
        throw new Error('hex string has invalid characters');
    }
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) {
            throw new Error(`invalid hex at position ${i * 2}`);
        }
        out[i] = byte;
    }

    return out;
};
