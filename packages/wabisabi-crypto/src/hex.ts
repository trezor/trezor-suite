/**
 * Port of `NWabiSabi/WabiSabi/Helpers/ByteHelpers.cs`.
 *
 * `Convert.ToHexString` emits UPPERCASE hex, and the coordinator sees these strings
 * verbatim in the credential request JSON. Lowercase hex is a rejected registration,
 * so the case is part of the wire format, not a formatting preference.
 */
export const toHex = (bytes: Uint8Array) => {
    let hex = '';
    for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, '0').toUpperCase();
    }

    return hex;
};

export const fromHex = (hex: string) => {
    if (hex.trim().length === 0) {
        return new Uint8Array(0);
    }
    if (hex.length % 2 !== 0) {
        throw new Error('Hex string must have an even number of characters.');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) {
            throw new Error(`Invalid hex string: ${hex}`);
        }
        bytes[i] = byte;
    }

    return bytes;
};
