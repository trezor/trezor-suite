/**
 * parse firmware headers
 * based on
 * https://github.com/trezor/trezor-firmware/blob/main/python/src/trezorlib/firmware/vendor.py#L99-L119
 * https://github.com/trezor/trezor-firmware/blob/main/python/src/trezorlib/firmware/core.py#L63-L88
 */
export const parseFirmwareHeaders = (buff: Buffer) => {
    const vendorHeader = buff.subarray(0, 4).toString('utf8');
    let trezorImageHeader = '';

    let restbuff: Buffer | undefined;
    if (vendorHeader === 'TRZV') {
        const vendorHeaderLength = buff.readUInt32LE(4);
        trezorImageHeader = buff
            .subarray(vendorHeaderLength, vendorHeaderLength + 4)
            .toString('utf8');
        restbuff = buff.subarray(vendorHeaderLength + 4);
    } else if (vendorHeader === 'TRZR') {
        restbuff = buff.subarray(256 + 4);
        trezorImageHeader = buff.subarray(256, 256 + 4).toString('utf8');
    } else {
        restbuff = buff.subarray(4);
        trezorImageHeader = buff.subarray(0, 4).toString('utf8');
    }

    if (trezorImageHeader !== 'TRZF') {
        throw new Error(`unexpected header ${vendorHeader}`);
    }

    // we don't need this value
    // const trezorImageHeaderLength = restbuff.readUint32LE(0);

    // we don't need this value
    // const expiry = restbuff.readUInt32LE(4);

    // we don't need this value
    // const code_length = restbuff.readUInt32LE(8);

    const version_major = restbuff.readInt8(12);

    const version_minor = restbuff.readInt8(13);

    const version_patch = restbuff.readInt8(14);

    const version: [number, number, number] = [version_major, version_minor, version_patch];

    return {
        version,
    };
};
