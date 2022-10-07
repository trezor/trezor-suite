export const reverseBuffer = (src: Buffer) => {
    if (src.length < 1) return src;
    const buffer = Buffer.alloc(src.length);
    let j = buffer.length - 1;
    for (let i = 0; i < buffer.length / 2; i++) {
        buffer[i] = src[j];
        buffer[j] = src[i];
        j--;
    }
    return buffer;
};
