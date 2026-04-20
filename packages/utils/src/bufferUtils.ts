export const reverseBuffer = (src: Buffer): Buffer => {
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

export const getChunkSize = (n: number): Buffer => {
    const buf = Buffer.allocUnsafe(1);
    buf.writeUInt8(n);

    return buf;
};

export const bufferToBytes = (buffer: Buffer<ArrayBuffer>): ArrayBuffer =>
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

/**
 * Forces the broader ArrayBufferLike buffer (a shared or non-shared buffer) to the plain non-shared buffer if needed,
 * though a non-shared buffer is left unchanged.
 * Our codebase should generally work with the broader type, but conversion is needed to interface with APIs
 * that only accept non-shared buffers (e.g. `crypto.subtle.digest`).
 */
export const toNonSharedBuffer = (view: Buffer<ArrayBufferLike>): Buffer<ArrayBuffer> => {
    if (view.buffer instanceof ArrayBuffer) {
        return view as Buffer<ArrayBuffer>;
    }

    return Buffer.from(view); // byte-copy of original buffer
};
