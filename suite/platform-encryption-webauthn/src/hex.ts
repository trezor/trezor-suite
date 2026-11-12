export const bytesToHex = (bytes: Uint8Array<ArrayBuffer>): string =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> | undefined => {
    if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
        return undefined;
    }

    return Uint8Array.from(hex.match(/../g) ?? [], pair => parseInt(pair, 16));
};

export const getRandomBytes = (length: number): Uint8Array<ArrayBuffer> =>
    crypto.getRandomValues(new Uint8Array(length));
