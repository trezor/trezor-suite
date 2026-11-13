import { bytesToBigInt, bytesToHex, getAddress, hexToBytes, isHex, numberToBytes } from 'viem';

import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatField,
    EthereumDisplayFormatPath,
} from '@trezor/connect-common';

import { AbiTuple, type AbiValue, parseCalldataParameters } from './parseCalldata';

const SELECTOR_SIZE = 4;
const ADDRESS_SIZE = 20;

export type DisplayFormatValue =
    | { type: 'address'; address: string }
    | { type: 'nativeAmount'; amount: string }
    // Without `tokenAddress` the definition does not say which token the amount is in.
    | { type: 'tokenAmount'; amount: string; tokenAddress?: string }
    | { type: 'aboveThreshold'; message?: string }
    | { type: 'date'; timestamp: number }
    | { type: 'text'; text: string };

export type DisplayFormatRow = {
    label: string;
    // A field pointing at an array shows one value per element.
    values: DisplayFormatValue[];
};

export type ResolvedDisplayFormat = {
    contractAddress: string;
    providerName?: string;
    intent: string;
    rows: DisplayFormatRow[];
};

export type DisplayFormatTransaction = {
    from: string;
    to: string;
    value: bigint;
    data: string;
};

type PathWalker = (path: EthereumDisplayFormatPath) => AbiValue;

const toWordBytes = (value: AbiValue) => {
    if (typeof value !== 'bigint') {
        return value;
    }
    if (value < 0n) {
        throw new Error('cannot slice a signed value');
    }

    return numberToBytes(value, { size: 32 });
};

const walkStep = (value: AbiValue, step: number) => {
    const items = value instanceof AbiTuple ? value.items : value;
    if (!Array.isArray(items) && !(items instanceof Uint8Array)) {
        throw new Error('cannot walk into a basic value');
    }
    const item = items.at(step);
    if (item === undefined) {
        throw new Error('index out of range');
    }

    return typeof item === 'number' ? BigInt(item) : item;
};

type PathSlice = NonNullable<Extract<EthereumDisplayFormatPath, { type: 'data' }>['slice']>;

const sliceValue = (value: AbiValue, { start, end }: PathSlice) => {
    const sliceable = toWordBytes(value);
    if (sliceable instanceof AbiTuple) {
        return new AbiTuple(sliceable.items.slice(start, end));
    }
    if (!Array.isArray(sliceable) && !(sliceable instanceof Uint8Array)) {
        throw new Error('cannot slice a basic value');
    }

    return sliceable.slice(start, end);
};

const createPathWalker =
    (parameters: AbiValue[], transaction: DisplayFormatTransaction): PathWalker =>
    path => {
        switch (path.type) {
            case 'const':
                return path.value;
            case 'container':
                if (path.container === 'FROM') return hexToBytes(getAddress(transaction.from));
                if (path.container === 'TO') return hexToBytes(getAddress(transaction.to));

                return transaction.value;
            case 'data': {
                if (path.steps.length === 0 && !path.slice) {
                    throw new Error('empty path');
                }
                let value: AbiValue = parameters;
                path.steps.forEach(step => {
                    value = walkStep(value, step);
                });
                if (path.slice) {
                    value = sliceValue(value, path.slice);
                }
                if (value instanceof AbiTuple) {
                    throw new Error('path resolves to a tuple');
                }

                return value;
            }
        }
    };

const toInteger = (value: AbiValue) => {
    if (value instanceof Uint8Array) return bytesToBigInt(value);
    if (typeof value === 'bigint') return value;

    throw new Error('not an integer');
};

const toAddress = (bytes: Uint8Array) => {
    if (bytes.length !== ADDRESS_SIZE) {
        throw new Error('not an address');
    }

    return getAddress(bytesToHex(bytes));
};

// Python's `{:g}`: six significant digits, no trailing zeros.
const formatGeneral = (value: number) => {
    const exponent = value === 0 ? 0 : Math.floor(Math.log10(Math.abs(value)));
    if (exponent < -4 || exponent >= 6) {
        return value
            .toExponential(5)
            .replace(/\.?0+e/, 'e')
            .replace(/e([+-])(\d)$/, 'e$10$2');
    }

    return String(Number(value.toPrecision(6)));
};

const SI_PREFIXES: Record<number, string> = { 12: 'T', 9: 'G', 6: 'M', 3: 'k', 0: '', [-3]: 'm' };

const formatUnit = (
    value: bigint,
    { decimals = 0, base = '', prefix }: EthereumDisplayFormatField,
) => {
    const scaled = Number(value) / 10 ** decimals;
    if (!prefix || scaled === 0) {
        return `${formatGeneral(scaled)}${base}`;
    }

    let magnitude = Math.abs(scaled);
    let exponent = 0;
    if (magnitude >= 1) {
        while (magnitude >= 1000 && exponent < 12) {
            magnitude /= 1000;
            exponent += 3;
        }
    } else {
        while (magnitude < 1 && exponent > -3) {
            magnitude *= 1000;
            exponent -= 3;
        }
    }

    return `${formatGeneral(scaled / 10 ** exponent)}${SI_PREFIXES[exponent] ?? ''}${base}`;
};

const formatDuration = (seconds: bigint) => {
    if (seconds < 0n) {
        throw new Error('negative duration');
    }
    const pad = (part: bigint) => part.toString().padStart(2, '0');

    return `${pad(seconds / 3600n)}:${pad((seconds / 60n) % 60n)}:${pad(seconds % 60n)}`;
};

const formatRaw = (value: AbiValue): string => {
    if (typeof value === 'string') return value;
    if (value instanceof Uint8Array) return bytesToHex(value).slice(2);
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'bigint') return value.toString();

    throw new Error('not a raw value');
};

const resolveTokenAddress = (field: EthereumDisplayFormatField, walkPath: PathWalker) => {
    if (field.constTokenAddress) {
        return hexToBytes(field.constTokenAddress as `0x${string}`);
    }
    if (!field.tokenPath) {
        return undefined;
    }
    const tokenAddress = walkPath(field.tokenPath);
    if (!(tokenAddress instanceof Uint8Array)) {
        throw new Error('token path does not resolve to an address');
    }

    return tokenAddress;
};

const formatTokenAmount = (
    value: AbiValue,
    field: EthereumDisplayFormatField,
    walkPath: PathWalker,
): DisplayFormatValue => {
    if (typeof value !== 'bigint') {
        throw new Error('not an amount');
    }
    const amount = value.toString();
    const tokenAddress = resolveTokenAddress(field, walkPath);
    const tokenAddressHex = tokenAddress && bytesToHex(tokenAddress).toLowerCase();
    const isNative =
        !!tokenAddressHex &&
        field.nativeCurrencyAddresses.some(address => address.toLowerCase() === tokenAddressHex);

    if (field.threshold && value >= BigInt(field.threshold)) {
        return { type: 'aboveThreshold', message: field.thresholdMessage };
    }
    if (isNative) {
        return { type: 'nativeAmount', amount };
    }

    return {
        type: 'tokenAmount',
        amount,
        tokenAddress: tokenAddress && toAddress(tokenAddress),
    };
};

const formatValue = (
    value: AbiValue,
    field: EthereumDisplayFormatField,
    walkPath: PathWalker,
): DisplayFormatValue => {
    switch (field.formatter) {
        case 'FORMATTER_ADDRESS_NAME':
            if (typeof value === 'string') return { type: 'text', text: value };
            if (value instanceof Uint8Array) return { type: 'address', address: toAddress(value) };
            throw new Error('not an address');
        case 'FORMATTER_AMOUNT':
            if (typeof value !== 'bigint') throw new Error('not an amount');

            return { type: 'nativeAmount', amount: value.toString() };
        case 'FORMATTER_TOKEN_AMOUNT':
            return formatTokenAmount(value, field, walkPath);
        case 'FORMATTER_UNIT':
            if (typeof value !== 'bigint') throw new Error('not a number');

            return { type: 'text', text: formatUnit(value, field) };
        case 'FORMATTER_DATE': {
            const timestamp = Number(toInteger(value));
            if (!Number.isSafeInteger(timestamp * 1000)) throw new Error('not a date');

            return { type: 'date', timestamp };
        }
        case 'FORMATTER_DURATION':
            return { type: 'text', text: formatDuration(toInteger(value)) };
        case 'FORMATTER_ENUM': {
            const key = toInteger(value);
            const entry = field.enumValues.find(({ key: entryKey }) => BigInt(entryKey) === key);
            if (!entry) throw new Error('unknown enum value');

            return { type: 'text', text: entry.value };
        }
        // Nested calls are not looked up: shown as raw hex, which the device falls back to as well.
        case 'FORMATTER_CALLDATA':
        case 'FORMATTER_RAW':
            return { type: 'text', text: formatRaw(value) };
    }
};

const resolveRow = (field: EthereumDisplayFormatField, walkPath: PathWalker): DisplayFormatRow => {
    const value = walkPath(field.path);
    const elements = Array.isArray(value) ? value : [value];

    return {
        label: field.label,
        values: elements.map(element => formatValue(element, field, walkPath)),
    };
};

/**
 * Evaluates the clear-signing definition of a contract call against the transaction, the way
 * the device does before showing it. Returns `undefined` when the call cannot be displayed
 * with this definition.
 */
export const resolveDisplayFormat = (
    displayFormat: EthereumDisplayFormat,
    transaction: DisplayFormatTransaction,
): ResolvedDisplayFormat | undefined => {
    try {
        if (!isHex(transaction.data)) {
            return undefined;
        }
        const data = hexToBytes(transaction.data);
        const selector = bytesToHex(data.subarray(0, SELECTOR_SIZE));
        if (selector !== displayFormat.functionSignature.toLowerCase()) {
            return undefined;
        }

        const parameters = parseCalldataParameters(
            displayFormat.parameters,
            data.subarray(SELECTOR_SIZE),
        );
        const walkPath = createPathWalker(parameters, transaction);

        return {
            contractAddress: getAddress(displayFormat.address),
            providerName: displayFormat.providerName,
            intent: displayFormat.intent,
            rows: displayFormat.fields.map(field => resolveRow(field, walkPath)),
        };
    } catch {
        return undefined;
    }
};
