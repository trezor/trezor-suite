import { blake2sHex } from 'blakejs';

const SIZE_T1 = (7 * 128 + 64) * 1024;
const SIZE_TT = 13 * 128 * 1024;

export const calculateFirmwareHash = (major_version: number, fw: ArrayBuffer, key?: Buffer) => {
    const size = major_version === 1 ? SIZE_T1 : SIZE_TT;
    const padding = size - fw.byteLength;
    if (padding < 0) {
        throw new Error('Firmware too big');
    }
    const data = new Uint8Array(new ArrayBuffer(size));
    data.set(new Uint8Array(fw));
    if (padding > 0) {
        const zeroBytes = Buffer.alloc(padding);
        zeroBytes.fill(Buffer.from('ff', 'hex'));
        data.set(zeroBytes, fw.byteLength);
    }

    return {
        hash: key && key.length > 0 ? blake2sHex(data, key) : blake2sHex(data),
        challenge: key ? key.toString('hex') : '',
    };
};
