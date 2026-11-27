import { isHex } from '@trezor/utils';

import type {
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
    EthereumDisplayFormatPath,
} from '../types/api/ethereum/displayFormat';

// Port of the firmware calldata parser and path walker, so values the device rejects are rejected
// here as well: https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing.py

const WORD_SIZE = 32;
const ADDRESS_SIZE = 20;
const SELECTOR_SIZE = 4;
const MAX_ABI_NESTING = 8;
const MAX_NESTED_ARRAYS = 2;

/** The device blind-signs calldata it cannot hold whole (firmware `_MAX_DATA_STORED`), in bytes. */
export const MAX_CLEAR_SIGNING_DATA_LENGTH = 6144;

/** The device refuses to clear-sign with the definition: the firmware's `ClearSigningFailed`. */
export class DisplayFormatRejectedError extends Error {
    name = 'DisplayFormatRejectedError';
}

export class DisplayFormatAbiTuple {
    constructor(readonly items: DisplayFormatAbiValue[]) {}
}

export type DisplayFormatAbiValue =
    bigint | boolean | string | Uint8Array | DisplayFormatAbiTuple | DisplayFormatAbiValue[];

type AbiNode = {
    isDynamic: boolean;
    // Bytes the value occupies in place: one word for a dynamic value, which holds its offset.
    headSize: number;
    parseBody: (data: Uint8Array, position: number) => DisplayFormatAbiValue;
};

const bytesToBigInt = (bytes: Uint8Array) =>
    bytes.reduce((value, byte) => (value << 8n) | BigInt(byte), 0n);

const bigIntToWord = (value: bigint) => {
    const word = new Uint8Array(WORD_SIZE);
    let rest = value;
    for (let index = WORD_SIZE - 1; index >= 0; index--) {
        word[index] = Number(rest & 0xffn);
        rest >>= 8n;
    }

    return word;
};

// Hosts pass calldata with or without the 0x prefix. Odd-length hex is rejected rather than
// padded: padding would shift every word and show values the device never sees.
export const hexToDisplayFormatBytes = (hex: string) => {
    const digits = hex.trim().replace(/^0x/i, '');
    if (digits.length % 2 !== 0 || !isHex(digits, { prefix: 'prohibited' })) {
        return undefined;
    }

    return Uint8Array.from({ length: digits.length / 2 }, (_, index) =>
        parseInt(digits.slice(index * 2, index * 2 + 2), 16),
    );
};

const readWord = (data: Uint8Array, position: number) => {
    if (position < 0 || position + WORD_SIZE > data.length) {
        throw new DisplayFormatRejectedError('out of bounds');
    }

    return data.subarray(position, position + WORD_SIZE);
};

const assertZeroPadding = (bytes: Uint8Array) => {
    if (bytes.some(byte => byte !== 0)) {
        throw new DisplayFormatRejectedError('value overflow');
    }
};

const readLength = (data: Uint8Array, position: number) => {
    const length = bytesToBigInt(readWord(data, position));
    if (length > BigInt(data.length)) {
        throw new DisplayFormatRejectedError('out of bounds');
    }

    return Number(length);
};

const parseAtomic = (abiType: string, word: Uint8Array): DisplayFormatAbiValue => {
    if (abiType === 'ABI_ADDRESS') {
        assertZeroPadding(word.subarray(0, WORD_SIZE - ADDRESS_SIZE));

        return word.slice(WORD_SIZE - ADDRESS_SIZE);
    }
    if (abiType === 'ABI_BOOL') {
        const value = bytesToBigInt(word);
        if (value > 1n) {
            throw new DisplayFormatRejectedError('value overflow');
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
            throw new DisplayFormatRejectedError('value overflow');
        }

        return value;
    }

    const bytesMatch = abiType.match(/^ABI_BYTES(\d+)$/);
    if (bytesMatch) {
        const size = Number(bytesMatch[1]);
        assertZeroPadding(word.subarray(size));

        return word.slice(0, size);
    }

    throw new DisplayFormatRejectedError(`unsupported atomic type ${abiType}`);
};

const parseDynamicLeaf = (abiType: string, bytes: Uint8Array): DisplayFormatAbiValue => {
    if (abiType === 'ABI_BYTES') {
        return bytes.slice();
    }
    if (abiType === 'ABI_STRING') {
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
            throw new DisplayFormatRejectedError('invalid UTF-8 string');
        }
    }

    throw new DisplayFormatRejectedError(`unsupported dynamic type ${abiType}`);
};

// Reads the value whose head is at `offset`; offsets in a dynamic head are relative to `blockStart`.
const parseValue = (node: AbiNode, data: Uint8Array, offset: number, blockStart: number) => {
    if (offset + node.headSize > data.length) {
        throw new DisplayFormatRejectedError('out of bounds');
    }
    if (!node.isDynamic) {
        return node.parseBody(data, offset);
    }

    const pointer = bytesToBigInt(readWord(data, offset));
    if (pointer > BigInt(data.length)) {
        throw new DisplayFormatRejectedError('out of bounds');
    }

    return node.parseBody(data, blockStart + Number(pointer));
};

const createAbiNode = (
    definition: EthereumDisplayFormatAbiValue,
    isTupleFlagTrusted: boolean,
    depth = 0,
    arrays = 0,
): AbiNode => {
    if (depth > MAX_ABI_NESTING || arrays > MAX_NESTED_ARRAYS) {
        throw new DisplayFormatRejectedError('ABI nested too deep');
    }
    if (
        (definition.type === 'atomic' || definition.type === 'dynamic') &&
        typeof definition.abiType !== 'string'
    ) {
        throw new DisplayFormatRejectedError('unknown ABI type');
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
                        throw new DisplayFormatRejectedError('out of bounds');
                    }

                    return parseDynamicLeaf(
                        definition.abiType,
                        data.subarray(start, start + length),
                    );
                },
            };
        case 'tuple': {
            if (definition.fields.length === 0) {
                throw new DisplayFormatRejectedError('empty tuple');
            }
            const fields = definition.fields.map(field =>
                createAbiNode(field, isTupleFlagTrusted, depth + 1, arrays),
            );
            const fieldsSize = fields.reduce((size, field) => size + field.headSize, 0);
            const isDynamic =
                isTupleFlagTrusted && depth === 0 && definition.isDynamic !== undefined
                    ? definition.isDynamic
                    : fields.some(field => field.isDynamic);

            return {
                isDynamic,
                headSize: isDynamic ? WORD_SIZE : fieldsSize,
                parseBody: (data, position) => {
                    if (position + fieldsSize > data.length) {
                        throw new DisplayFormatRejectedError('out of bounds');
                    }
                    let headOffset = position;

                    return new DisplayFormatAbiTuple(
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
            const element = createAbiNode(
                definition.element,
                isTupleFlagTrusted,
                depth + 1,
                arrays + 1,
            );

            return {
                isDynamic: true,
                headSize: WORD_SIZE,
                parseBody: (data, position) => {
                    const length = readLength(data, position);
                    const elementsStart = position + WORD_SIZE;
                    if (elementsStart + length * element.headSize > data.length) {
                        throw new DisplayFormatRejectedError('out of bounds');
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
        // A definition built from a newer protobuf than this client knows.
        default:
            throw new DisplayFormatRejectedError('unknown ABI value');
    }
};

type ParseDisplayFormatCalldataOptions = {
    // The definition's top-level tuple flag decides how the tuple is read (firmware < 2.13.0).
    isTupleFlagTrusted?: boolean;
};

/** Parses the call arguments (calldata without the selector) into one value per parameter. */
export const parseDisplayFormatCalldata = (
    definitions: EthereumDisplayFormatAbiValue[],
    calldata: Uint8Array,
    { isTupleFlagTrusted = false }: ParseDisplayFormatCalldataOptions = {},
): DisplayFormatAbiValue[] => {
    let offset = 0;

    return definitions.map(definition => {
        const node = createAbiNode(definition, isTupleFlagTrusted);
        const value = parseValue(node, calldata, offset, 0);
        offset += node.headSize;

        return value;
    });
};

export type DisplayFormatPathWalker = (path: EthereumDisplayFormatPath) => DisplayFormatAbiValue;

// The transaction fields container paths point at. Inside an embedded call only `to` is known:
// whether `from` is the wrapper or the signer depends on how the wrapper makes the call.
export type DisplayFormatContainers = {
    // The device resolves `@.from` to the name of the signing account, not to its address.
    from?: string;
    to?: Uint8Array;
    value?: bigint;
};

const toWordBytes = (value: DisplayFormatAbiValue) => {
    if (typeof value !== 'bigint') {
        return value;
    }
    if (value < 0n) {
        throw new DisplayFormatRejectedError('cannot slice a signed value');
    }

    return bigIntToWord(value);
};

const walkStep = (value: DisplayFormatAbiValue, step: number) => {
    const items = value instanceof DisplayFormatAbiTuple ? value.items : value;
    if (!Array.isArray(items) && !(items instanceof Uint8Array)) {
        throw new DisplayFormatRejectedError('cannot walk into a basic value');
    }
    const item = items.at(step);
    if (item === undefined) {
        throw new DisplayFormatRejectedError('index out of range');
    }

    return typeof item === 'number' ? BigInt(item) : item;
};

type PathSlice = NonNullable<Extract<EthereumDisplayFormatPath, { type: 'data' }>['slice']>;

const sliceValue = (value: DisplayFormatAbiValue, { start, end }: PathSlice) => {
    const sliceable = toWordBytes(value);
    if (sliceable instanceof DisplayFormatAbiTuple) {
        return new DisplayFormatAbiTuple(sliceable.items.slice(start, end));
    }
    if (!Array.isArray(sliceable) && !(sliceable instanceof Uint8Array)) {
        throw new DisplayFormatRejectedError('cannot slice a basic value');
    }

    return sliceable.slice(start, end);
};

const getContainerValue = (
    { from, to, value }: DisplayFormatContainers,
    container: Extract<EthereumDisplayFormatPath, { type: 'container' }>['container'],
) => {
    const resolved = { FROM: from, TO: to, VALUE: value }[container];
    if (resolved === undefined) {
        throw new DisplayFormatRejectedError(`unresolvable container ${container}`);
    }

    return resolved;
};

export const createDisplayFormatPathWalker =
    (
        parameters: DisplayFormatAbiValue[],
        containers: DisplayFormatContainers,
    ): DisplayFormatPathWalker =>
    path => {
        switch (path.type) {
            case 'const':
                return path.value;
            case 'container':
                return getContainerValue(containers, path.container);
            case 'data': {
                if (path.steps.length === 0 && !path.slice) {
                    throw new DisplayFormatRejectedError('empty path');
                }
                let value: DisplayFormatAbiValue = parameters;
                path.steps.forEach(step => {
                    value = walkStep(value, step);
                });
                if (path.slice) {
                    value = sliceValue(value, path.slice);
                }
                if (value instanceof DisplayFormatAbiTuple) {
                    throw new DisplayFormatRejectedError('path resolves to a tuple');
                }

                return value;
            }
        }
    };

export type DisplayFormatSubcall = {
    // 1-based position when the field holds an array of calls (a multicall).
    index?: number;
    callee: Uint8Array;
    calldata: Uint8Array;
    // Missing when the calldata is too short to hold a selector: the device then shows it raw.
    selector?: Uint8Array;
    arguments: Uint8Array;
};

const toSubcall = (
    calldata: DisplayFormatAbiValue,
    callee: DisplayFormatAbiValue | undefined,
    explicitSelector: Uint8Array | undefined,
    index?: number,
): DisplayFormatSubcall => {
    if (!(calldata instanceof Uint8Array)) {
        throw new DisplayFormatRejectedError('embedded calldata is not bytes');
    }
    if (!(callee instanceof Uint8Array) || callee.length !== ADDRESS_SIZE) {
        throw new DisplayFormatRejectedError('callee is not an address');
    }
    // Per ERC-7730, a field with an explicit selector holds the arguments only.
    if (explicitSelector) {
        return { index, callee, calldata, selector: explicitSelector, arguments: calldata };
    }
    if (calldata.length < SELECTOR_SIZE) {
        return { index, callee, calldata, arguments: calldata };
    }

    return {
        index,
        callee,
        calldata,
        selector: calldata.slice(0, SELECTOR_SIZE),
        arguments: calldata.subarray(SELECTOR_SIZE),
    };
};

/**
 * The calls embedded in a `FORMATTER_CALLDATA` field. Throws where the device fails the whole
 * transaction: the field does not resolve to calldata and callee addresses that pair up.
 */
export const getDisplayFormatSubcalls = (
    field: EthereumDisplayFormatField,
    walkPath: DisplayFormatPathWalker,
): DisplayFormatSubcall[] => {
    if (!field.calleePath) {
        throw new DisplayFormatRejectedError('calldata field without a callee path');
    }
    const explicitSelector = field.selector ? hexToDisplayFormatBytes(field.selector) : undefined;
    if (field.selector && explicitSelector?.length !== SELECTOR_SIZE) {
        throw new DisplayFormatRejectedError('invalid selector');
    }

    const calldata = walkPath(field.path);
    const callees = walkPath(field.calleePath);
    if (!Array.isArray(calldata)) {
        return [toSubcall(calldata, callees, explicitSelector)];
    }
    if (Array.isArray(callees) && callees.length !== calldata.length) {
        throw new DisplayFormatRejectedError('callees do not match the embedded calls');
    }

    return calldata.map((item, index) =>
        toSubcall(
            item,
            Array.isArray(callees) ? callees[index] : callees,
            explicitSelector,
            index + 1,
        ),
    );
};
