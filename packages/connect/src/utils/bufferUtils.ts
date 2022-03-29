export const reverseBuffer = (buf: Buffer) => {
    const copy = Buffer.alloc(buf.length);
    buf.copy(copy);
    [].reverse.call(copy);
    return copy;
};
