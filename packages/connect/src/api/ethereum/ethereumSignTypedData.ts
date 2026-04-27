// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/ethereumSignTypedData.js

import { hashDomain, hashStruct } from 'viem';
import type { TypedDataDomain } from 'viem';

import type { EthereumSignTypedDataTypes } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { messageToHex } from '../../utils/formatUtils';

// Copied from https://github.com/ethers-io/ethers.js/blob/v5.5.2/packages/abi/src.ts/fragments.ts#L249
const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);

/**
 * Parse the given EIP-712 array type into its entries, and its length (if not dynamic)
 * E.g. `uint16[32]` will return `{entryTypeName: 'uint16', arraySize: 32}`.
 */
export function parseArrayType(arrayTypeName: string) {
    const arrayMatch = paramTypeArray.exec(arrayTypeName);
    if (arrayMatch === null) {
        throw ERRORS.TypedError(
            'Runtime',
            `typename ${arrayTypeName} could not be parsed as an EIP-712 array`,
        );
    }
    const [_, entryTypeName, arraySize] = arrayMatch;

    return {
        entryTypeName,
        arraySize: parseInt(arraySize, 10) || null,
    };
}

/**
 * Converts a number to a two's complement representation.
 *
 * E.g. -128 would be 0x80 in two's complement, while 127 would be 0x7F.
 *
 * BigNumber.js has no built-in function, unlike https://www.npmjs.com/package/bn.js
 */
function twosComplement(number: BigNumber, bytes: number) {
    if (bytes < 1 || bytes > 32) {
        throw ERRORS.TypedError(
            'Runtime',
            'Int byte size must be between 1 and 32 (8 and 256 bits)',
        );
    }
    // Determine value range
    const minValue = new BigNumber(2).exponentiatedBy(bytes * 8 - 1).negated();
    const maxValue = minValue.negated().minus(1);

    const bigNumber = new BigNumber(number);

    if (bigNumber.isGreaterThan(maxValue) || bigNumber.isLessThan(minValue)) {
        throw ERRORS.TypedError(
            'Runtime',
            `Overflow when trying to convert number ${number} into ${bytes} bytes`,
        );
    }

    if (bigNumber.isPositive()) {
        return bigNumber;
    }

    return bigNumber.minus(minValue).minus(minValue);
}

function intToHex(number: BigNumber | bigint | number | string, bytes: number, signed: boolean) {
    let bigNumber = new BigNumber(number);
    if (signed) {
        bigNumber = twosComplement(bigNumber, bytes);
    }
    if (bigNumber.isNegative()) {
        throw ERRORS.TypedError(
            'Runtime',
            `Cannot convert negative number to unsigned interger: ${number}`,
        );
    }
    const hex = bigNumber.toString(16);
    const hexChars = bytes * 2;
    if (hex.length > hexChars) {
        throw ERRORS.TypedError(
            'Runtime',
            `Overflow when trying to convert number ${number} into ${bytes} bytes`,
        );
    }

    return hex.padStart(bytes * 2, '0');
}

/**
 * Encodes the given primitive data to a big-endian hex string.
 *
 * @param typeName - Primitive Solidity data type (e.g. `uint16`)
 * @param data - The actual data to convert.
 * @returns Hex string of the data.
 */
export function encodeData(typeName: string, data: any) {
    if (paramTypeBytes.test(typeName) || typeName === 'address') {
        return messageToHex(data);
    }
    if (typeName === 'string') {
        return Buffer.from(data, 'utf-8').toString('hex');
    }
    const numberMatch = paramTypeNumber.exec(typeName);
    if (numberMatch) {
        const [_, intType, bits] = numberMatch;
        const bytes = Math.ceil(parseInt(bits, 10) / 8);

        return intToHex(data, bytes, intType === 'int');
    }
    if (typeName === 'bool') {
        return data ? '01' : '00';
    }

    // We should be receiving only atomic, non-array types
    throw ERRORS.TypedError(
        'Runtime',
        `Unsupported data type for direct field encoding: ${typeName}`,
    );
}

// these are simple types, so we can just do a string-match
const paramTypesMap = {
    string: PROTO.EthereumDataType.STRING,
    bool: PROTO.EthereumDataType.BOOL,
    address: PROTO.EthereumDataType.ADDRESS,
};

/**
 * Converts the given EIP-712 typename into a Protobuf package.
 *
 * @param typeName - The EIP-712 typename (e.g. `uint16` for simple types, `Example` for structs)
 * @param types - Map of types, required for recursive (`struct`) types.
 */
export function getFieldType(
    typeName: string,
    types: EthereumSignTypedDataTypes,
): PROTO.EthereumFieldType {
    const arrayMatch = paramTypeArray.exec(typeName);
    if (arrayMatch) {
        const [_, arrayItemTypeName, arraySize] = arrayMatch;
        const entryType = getFieldType(arrayItemTypeName, types);

        return {
            data_type: PROTO.EthereumDataType.ARRAY,
            size: parseInt(arraySize, 10) || undefined,
            entry_type: entryType,
        };
    }

    const numberMatch = paramTypeNumber.exec(typeName);
    if (numberMatch) {
        const [_, type, bits] = numberMatch;

        return {
            data_type: type === 'uint' ? PROTO.EthereumDataType.UINT : PROTO.EthereumDataType.INT,
            size: Math.floor(parseInt(bits, 10) / 8),
        };
    }

    const bytesMatch = paramTypeBytes.exec(typeName);
    if (bytesMatch) {
        const [_, size] = bytesMatch;

        return {
            data_type: PROTO.EthereumDataType.BYTES,
            size: parseInt(size, 10) || undefined,
        };
    }

    const fixedSizeTypeMatch = paramTypesMap[typeName as keyof typeof paramTypesMap];
    if (fixedSizeTypeMatch) {
        return {
            data_type: fixedSizeTypeMatch,
        };
    }

    if (typeName in types) {
        return {
            data_type: PROTO.EthereumDataType.STRUCT,
            size: types[typeName].length,
            struct_name: typeName,
        };
    }

    throw ERRORS.TypedError('Runtime', `No type definition specified: ${typeName}`);
}

// Pre-computed EIP-712 hashes for T1B1 firmware, which cannot construct them
// on-device. T2T1+ firmware computes hashes from `data` directly and ignores
// these fields. Inlined from the deprecated @trezor/connect-plugin-ethereum.

type LooseTypedDataDomain = {
    name?: string;
    version?: string;
    chainId?: string | number | bigint;
    verifyingContract?: string;
    salt?: string | ArrayBuffer;
};

type TransformTypedDataInput<T extends Record<string, readonly { name: string; type: string }[]>> =
    {
        types: T;
        primaryType: keyof T | string;
        domain: LooseTypedDataDomain;
        message: Record<string, unknown>;
    };

const arrayBufferToHex = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let hex = '0x';
    for (let i = 0; i < bytes.length; i += 1) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }

    return hex;
};

// viem's TypedDataDomain types `salt` and `verifyingContract` as `0x${string}`
// (template literal). Connect's public API accepts a plain string and historically
// (via @metamask/eth-sig-util) tolerated values without the `0x` prefix. Convert
// to the canonical `0x`-prefixed hex form so viem's encoder produces identical
// bytes to the legacy implementation.
const ensureHexPrefix = (value: string | undefined): `0x${string}` | undefined => {
    if (value === undefined) return undefined;

    return (value.startsWith('0x') ? value : `0x${value}`) as `0x${string}`;
};

const normalizeDomain = (domain: LooseTypedDataDomain): TypedDataDomain => {
    let { chainId } = domain;

    if (typeof chainId === 'string') {
        try {
            chainId = BigInt(chainId);
        } catch {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Trezor: Invalid typed data domain chainId. Expected an integer-compatible string.',
            );
        }
    }

    // ArrayBuffer is a legacy carrier for `salt` (eth-sig-util accepted it);
    // viem expects `0x`-prefixed hex strings only.
    const saltAsString =
        domain.salt instanceof ArrayBuffer ? arrayBufferToHex(domain.salt) : domain.salt;

    return {
        ...domain,
        chainId,
        verifyingContract: ensureHexPrefix(domain.verifyingContract),
        salt: ensureHexPrefix(saltAsString),
    };
};

export const transformTypedData = <
    T extends Record<string, readonly { name: string; type: string }[]>,
>(
    data: TransformTypedDataInput<T>,
    metamask_v4_compat: boolean,
) => {
    if (!metamask_v4_compat) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Trezor: Only version 4 of typed data signing is supported',
        );
    }

    // viem's hashDomain expects `EIP712Domain` to be present in `types`.
    // The legacy @metamask/eth-sig-util implementation tolerated its absence
    // by synthesizing the type from `domain` keys; we deliberately reject it
    // here so callers send a strictly EIP-712-conformant payload — silent
    // synthesis would mask schema mistakes that produce subtly different hashes.
    if (!data.types || !('EIP712Domain' in data.types)) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Trezor: EIP712Domain type definition required in types',
        );
    }

    const domain_separator_hash = hashDomain({
        domain: normalizeDomain(data.domain),
        types: data.types as any,
    }).slice(2);

    let message_hash: string | null = null;

    if (data.primaryType !== 'EIP712Domain') {
        message_hash = hashStruct({
            data: data.message,
            primaryType: data.primaryType as string,
            types: data.types as any,
        }).slice(2);
    }

    return { domain_separator_hash, message_hash };
};
