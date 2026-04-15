export const reverseBuffer = (src: Buffer) => {
    if (src.length < 1) return src;
    const buffer = Buffer.alloc(src.length);
    let j = buffer.length - 1;
    for (let i = 0; i < buffer.length / 2; i++) {
        buffer[i] = src[j] ?? 0;
        buffer[j] = src[i] ?? 0;
        j--;
    }

    return buffer;
};

export const getChunkSize = (n: number) => {
    const buf = Buffer.allocUnsafe(1);
    buf.writeUInt8(n);

    return buf;
};
