import { isHex } from '@trezor/utils';

export const toHex = (value: string): `0x${string}` => (isHex(value) ? value : `0x${value}`);
