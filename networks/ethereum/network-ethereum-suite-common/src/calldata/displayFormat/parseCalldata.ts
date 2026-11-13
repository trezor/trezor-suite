import { bytesToBigInt } from 'viem';

import type { EthereumDisplayFormatAbiValue } from '@trezor/connect-common';

// Port of the firmware calldata parser, so values the device rejects are rejected here as well:
// https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing.py

const WORD_SIZE = 32;
const ADDRESS_SIZE = 20;
const MAX_ABI_NESTING = 8;
const MAX_NESTED_ARRAYS = 2;

export class AbiTuple {
    constructor(readonly items: AbiValue[]) {}
}

export type AbiValue = bigint | boolean | string | Uint8Array | AbiTuple | AbiValue[];

type AbiNode = {
    isDynamic: boolean;
    // Bytes the value occupies in place: one word for a dynamic value, which holds its offset.
    headSize: number;
    parseBody: (data: Uint8Array, position: number) => AbiValue;
};

const readWord = (data: Uint8Array, position: number) => {
    if (position < 0 || position + WORD_SIZE > data.length) {
        throw new Error('out of bounds');
    }

    return data.subarray(position, position + WORD_SIZE);
};

const assertZeroPadding = (bytes: Uint8Array) => {
    if (bytes.some(byte => byte !== 0)) {
        throw new Error('value overflow');
    }
};

const readLength = (data: Uint8Array, position: number) => {
    const length = bytesToBigInt(readWord(data, position));
    if (length > BigInt(data.length)) {
        throw new Error('out of bounds');
    }

    return Number(length);
};

const parseAtomic = (abiType: string, word: Uint8Array): AbiValue => {
    if (abiType === 'ABI_ADDRESS') {
        assertZeroPadding(word.subarray(0, WORD_SIZE - ADDRESS_SIZE));

        return word.slice(WORD_SIZE - ADDRESS_SIZE);
    }
    if (abiType === 'ABI_BOOL') {
        const value = bytesToBigInt(word);
        if (value > 1n) {
            throw new Error('value overflow');
        }

        return value === 1n;
    }

    const uintMatch = abiType.match(/^ABI_UINT(\d+)$/);
    if (uintMatch) {
        assertZeroPadding(word.subarray(0, WORD_SIZE - Number(uintMatch[1]) / 8));

        return bytesToBigInt(word);
    }

    const intMatch = abiType.match(/^ABI_INT(\d+)$/);
    if (intMatch) {
        const bits = BigInt(Number(intMatch[1]));
        const unsigned = bytesToBigInt(word);
        const value = unsigned >= 1n << 255n ? unsigned - (1n << 256n) : unsigned;
        if (value < -(1n << (bits - 1n)) || value >= 1n << (bits - 1n)) {
            throw new Error('value overflow');
        }

        return value;
    }

    const bytesMatch = abiType.match(/^ABI_BYTES(\d+)$/);
    if (bytesMatch) {
        const size = Number(bytesMatch[1]);
        assertZeroPadding(word.subarray(size));

        return word.slice(0, size);
    }

    throw new Error(`unsupported atomic type ${abiType}`);
};

const parseDynamicLeaf = (abiType: string, bytes: Uint8Array): AbiValue => {
    if (abiType === 'ABI_BYTES') {
        return bytes.slice();
    }
    if (abiType === 'ABI_STRING') {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }

    throw new Error(`unsupported dynamic type ${abiType}`);
};

// Reads the value whose head is at `offset`; offsets in a dynamic head are relative to `blockStart`.
const parseValue = (node: AbiNode, data: Uint8Array, offset: number, blockStart: number) => {
    if (offset + node.headSize > data.length) {
        throw new Error('out of bounds');
    }
    if (!node.isDynamic) {
        return node.parseBody(data, offset);
    }

    const pointer = bytesToBigInt(readWord(data, offset));
    if (pointer > BigInt(data.length)) {
        throw new Error('out of bounds');
    }

    return node.parseBody(data, blockStart + Number(pointer));
};

const createAbiNode = (
    definition: EthereumDisplayFormatAbiValue,
    depth = 0,
    arrays = 0,
): AbiNode => {
    if (depth > MAX_ABI_NESTING || arrays > MAX_NESTED_ARRAYS) {
        throw new Error('ABI nested too deep');
    }

    switch (definition.type) {
        case 'atomic':
            return {
                isDynamic: false,
                headSize: WORD_SIZE,
                parseBody: (data, position) =>
                    parseAtomic(definition.abiType, readWord(data, position)),
            };
        case 'dynamic':
            return {
                isDynamic: true,
                headSize: WORD_SIZE,
                parseBody: (data, position) => {
                    const length = readLength(data, position);
                    const start = position + WORD_SIZE;
                    if (start + length > data.length) {
                        throw new Error('out of bounds');
                    }

                    return parseDynamicLeaf(
                        definition.abiType,
                        data.subarray(start, start + length),
                    );
                },
            };
        case 'tuple': {
            if (definition.fields.length === 0) {
                throw new Error('empty tuple');
            }
            const fields = definition.fields.map(field => createAbiNode(field, depth + 1, arrays));
            const fieldsSize = fields.reduce((size, field) => size + field.headSize, 0);
            const isDynamic = fields.some(field => field.isDynamic);

            return {
                isDynamic,
                headSize: isDynamic ? WORD_SIZE : fieldsSize,
                parseBody: (data, position) => {
                    if (position + fieldsSize > data.length) {
                        throw new Error('out of bounds');
                    }
                    let headOffset = position;

                    return new AbiTuple(
                        fields.map(field => {
                            const value = parseValue(field, data, headOffset, position);
                            headOffset += field.headSize;

                            return value;
                        }),
                    );
                },
            };
        }
        case 'array': {
            const element = createAbiNode(definition.element, depth + 1, arrays + 1);

            return {
                isDynamic: true,
                headSize: WORD_SIZE,
                parseBody: (data, position) => {
                    const length = readLength(data, position);
                    const elementsStart = position + WORD_SIZE;
                    if (elementsStart + length * element.headSize > data.length) {
                        throw new Error('out of bounds');
                    }

                    return Array.from({ length }, (_, index) =>
                        parseValue(
                            element,
                            data,
                            elementsStart + index * element.headSize,
                            elementsStart,
                        ),
                    );
                },
            };
        }
    }
};

/** Parses the call arguments (calldata without the selector) into one value per parameter. */
export const parseCalldataParameters = (
    definitions: EthereumDisplayFormatAbiValue[],
    calldata: Uint8Array,
): AbiValue[] => {
    let offset = 0;

    return definitions.map(definition => {
        const node = createAbiNode(definition);
        const value = parseValue(node, calldata, offset, 0);
        offset += node.headSize;

        return value;
    });
};
