import { tronUtils } from '@trezor/blockchain-link-utils';

import { type Encoder } from '../types/encoder';
import { type TronAddress, type TronFunctionAbi, type TronParamName } from '../types/tron';

const tronBase58ToEvmHex = (address: TronAddress): string => {
    const hex = tronUtils.tronAddressToHex(address);

    if (!hex) throw new Error('Invalid Tron address checksum.');

    return hex.slice(2);
};

const encodeParam = (type: string, value: unknown): string => {
    if (type === 'tron_address') {
        return tronBase58ToEvmHex(value as TronAddress).padStart(64, '0');
    }

    if (type === 'uint256') {
        return (value as bigint).toString(16).padStart(64, '0');
    }

    throw new Error(`Unsupported Tron param type: ${type}`);
};

export const createTronEncoder =
    <const T extends TronFunctionAbi>(abi: T): Encoder<TronParamName<T>, `0x${string}`> =>
    (values: Record<string, unknown>): `0x${string}` => {
        const encoded = abi.inputs.map(({ name, type }) => encodeParam(type, values[name]));

        return `0x${abi.selector}${encoded.join('')}`;
    };
