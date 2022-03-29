// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/bufferUtils.js

export const reverseBuffer = (buf: Buffer) => {
    const copy = Buffer.alloc(buf.length);
    buf.copy(copy);
    [].reverse.call(copy);
    return copy;
};
