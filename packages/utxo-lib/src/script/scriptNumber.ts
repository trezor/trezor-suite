// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/script_number.ts

export function decode(buffer: Buffer, maxLength = 4, minimal = true) {
    const { length } = buffer;
    if (length === 0) return 0;
    if (length > maxLength) throw new TypeError('Script number overflow');
    if (minimal) {
        if ((buffer[length - 1] & 0x7f) === 0) {
            if (length <= 1 || (buffer[length - 2] & 0x80) === 0)
                throw new Error('Non-minimally encoded script number');
        }
    }

    // 40-bit
    if (length === 5) {
        const a = buffer.readUInt32LE(0);
        const b = buffer.readUInt8(4);

        if (b & 0x80) return -((b & ~0x80) * 0x100000000 + a);
        return b * 0x100000000 + a;
    }

    let result = 0;

    // 32-bit / 24-bit / 16-bit / 8-bit
    for (let i = 0; i < length; ++i) {
        result |= buffer[i] << (8 * i);
    }

    if (buffer[length - 1] & 0x80) return -(result & ~(0x80 << (8 * (length - 1))));
    return result;
}

function scriptNumSize(i: number) {
    if (i > 0x7fffffff) return 5;
    if (i > 0x7fffff) return 4;
    if (i > 0x7fff) return 3;
    if (i > 0x7f) return 2;
    if (i > 0x00) return 1;
    return 0;
}

export function encode(number: number) {
    let value = Math.abs(number);
    const size = scriptNumSize(value);
    const buffer = Buffer.allocUnsafe(size);
    const negative = number < 0;

    for (let i = 0; i < size; ++i) {
        buffer.writeUInt8(value & 0xff, i);
        value >>= 8;
    }

    if (buffer[size - 1] & 0x80) {
        buffer.writeUInt8(negative ? 0x80 : 0x00, size - 1);
    } else if (negative) {
        buffer[size - 1] |= 0x80;
    }

    return buffer;
}
