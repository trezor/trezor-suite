import { type Encoder } from '../types/encoder';
import { type TronAddress, type TronFunctionAbi, type TronParamName } from '../types/tron';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Decodes a Tron base58 address to the 20-byte EVM address hex string (no prefix).
// Tron address is 25 bytes base58-encoded: 1-byte network prefix (0x41) + 20-byte hash + 4-byte checksum.
const tronBase58ToEvmHex = (address: TronAddress): string => {
    let num = BigInt(0);

    for (const char of address) {
        num = num * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(char));
    }

    // Full hex is 50 chars (25 bytes); skip first byte (0x41 network prefix), take next 20 bytes
    return num.toString(16).padStart(50, '0').slice(2, 42);
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
