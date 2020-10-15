import { createHash } from 'crypto';

export const getScore = (device_id: string) => {
    const hash = createHash('sha256');
    hash.update(device_id);
    const output = parseInt(hash.digest('hex'), 16) / 2 ** 256;
    return Math.round(output * 100) / 100;
};
