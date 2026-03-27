import { isHex } from 'viem';

export const toHex = (value: string): `0x${string}` => {
    if (isHex(value)) {
        return value;
    }

    return `0x${value}` as `0x${string}`;
};
