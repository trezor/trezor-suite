/** The length of a string as the network counts it, in UTF-8 bytes. */
export const getUtf8ByteLength = (value: string) => {
    let bytes = 0;

    for (const character of value) {
        const codePoint = character.codePointAt(0) ?? 0;

        if (codePoint < 0x80) {
            bytes += 1;
        } else if (codePoint < 0x800) {
            bytes += 2;
        } else if (codePoint < 0x10000) {
            bytes += 3;
        } else {
            bytes += 4;
        }
    }

    return bytes;
};
