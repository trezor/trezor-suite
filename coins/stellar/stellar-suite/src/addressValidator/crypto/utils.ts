export function numberToHex(number: number, sizeInBytes: number): string {
    return Math.round(number)
        .toString(16)
        .padStart(sizeInBytes * 2, '0');
}

export function toHex(arrayOfBytes: ArrayLike<number>): string {
    let hex = '';
    for (let i = 0; i < arrayOfBytes.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const byte: number = arrayOfBytes[i];
        hex += numberToHex(byte, 1);
    }

    return hex;
}
