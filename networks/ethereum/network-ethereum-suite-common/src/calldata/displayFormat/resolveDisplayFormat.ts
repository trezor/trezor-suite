import { bytesToBigInt, bytesToHex, getAddress, hexToBytes, isAddress } from 'viem';

import {
    type DisplayFormatAbiValue,
    type DisplayFormatPathWalker,
    type DisplayFormatSubcall,
    type EthereumDisplayFormat,
    type EthereumDisplayFormatField,
    createDisplayFormatPathWalker,
    getDisplayFormatSubcalls,
    hexToDisplayFormatBytes,
    parseDisplayFormatCalldata,
} from '@trezor/connect-common';
import {
    getWrappedNativeAddress,
    isNativeTokenWrappable,
} from '@trezor/network-ethereum/constants';
import { isSupportedEthereumNetwork } from '@trezor/network-ethereum-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getBuiltInSubcallDisplayFormat } from './builtInDisplayFormats';

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

// Rows of an embedded call carry its position, which the device puts in front of their labels.
// `index` is set when the call is one of several (a multicall).
export type DisplayFormatSubcallPosition = { index?: number };

export type DisplayFormatRow = {
    // A field pointing at an array shows one value per element.
    values: DisplayFormatValue[];
} & (
    | { type: 'field'; label: string; subcall?: DisplayFormatSubcallPosition }
    | {
          type: 'subcallProvider' | 'subcallIntent' | 'subcallCallee';
          subcall: DisplayFormatSubcallPosition;
      }
);

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

export type ResolveDisplayFormatOptions = {
    // Definitions of the calls the transaction embeds, downloaded along with its own.
    subcallDisplayFormats?: EthereumDisplayFormat[];
    // Picks the chain's WETH contract, whose deposit and withdraw the device knows without a definition.
    networkSymbol?: NetworkSymbol;
};

type RowContext = {
    chainId: number;
    subcallDisplayFormats: EthereumDisplayFormat[];
    wrappedNativeAddress?: string;
    walkPath: DisplayFormatPathWalker;
    // Inside an embedded call, further embedded calls are shown raw, as the device does.
    isSubcall: boolean;
};

const toInteger = (value: DisplayFormatAbiValue) => {
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

const formatRaw = (value: DisplayFormatAbiValue): string => {
    if (typeof value === 'string') return value;
    if (value instanceof Uint8Array) return bytesToHex(value).slice(2);
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'bigint') return value.toString();

    throw new Error('not a raw value');
};

const resolveTokenAddress = (
    field: EthereumDisplayFormatField,
    walkPath: DisplayFormatPathWalker,
) => {
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
    value: DisplayFormatAbiValue,
    field: EthereumDisplayFormatField,
    walkPath: DisplayFormatPathWalker,
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
    value: DisplayFormatAbiValue,
    field: EthereumDisplayFormatField,
    walkPath: DisplayFormatPathWalker,
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
        // Embedded calls expand into rows of their own (see `resolveRows`).
        case 'FORMATTER_CALLDATA':
        case 'FORMATTER_RAW':
            return { type: 'text', text: formatRaw(value) };
    }
};

// Left out when it is not an address, so only a field that reads it fails.
const toContainerAddress = (address: string) =>
    isAddress(address, { strict: false }) ? hexToBytes(address) : undefined;

const getWrappedNativeContract = (networkSymbol?: NetworkSymbol) =>
    networkSymbol &&
    isSupportedEthereumNetwork(networkSymbol) &&
    isNativeTokenWrappable(networkSymbol)
        ? getWrappedNativeAddress(networkSymbol)
        : undefined;

const findSubcallDisplayFormat = (
    { callee, selector }: DisplayFormatSubcall,
    { chainId, subcallDisplayFormats, wrappedNativeAddress }: RowContext,
) => {
    if (!selector) {
        return undefined;
    }
    const calleeHex = bytesToHex(callee);
    const selectorHex = bytesToHex(selector);

    return (
        getBuiltInSubcallDisplayFormat({
            selector: selectorHex,
            isWrappedNative:
                !!wrappedNativeAddress && wrappedNativeAddress.toLowerCase() === calleeHex,
        }) ??
        subcallDisplayFormats.find(
            displayFormat =>
                displayFormat.chainId === chainId &&
                displayFormat.address.toLowerCase() === calleeHex &&
                displayFormat.functionSignature.toLowerCase() === selectorHex,
        )
    );
};

// What the device shows for an embedded call it cannot decode: the callee and the raw calldata.
const getRawSubcallRows = (
    field: EthereumDisplayFormatField,
    { index, callee, calldata }: DisplayFormatSubcall,
): DisplayFormatRow[] => {
    const subcall = { index };
    const calldataValues: DisplayFormatValue[] = [{ type: 'text', text: formatRaw(calldata) }];

    return [
        {
            type: 'subcallCallee',
            subcall,
            values: [{ type: 'address', address: toAddress(callee) }],
        },
        index === undefined
            ? { type: 'field', label: field.label, values: calldataValues }
            : { type: 'field', label: field.label, subcall, values: calldataValues },
    ];
};

// The provider and intent rows the device shows before the fields of an embedded call.
const getSubcallHeaderRows = (
    displayFormat: Pick<EthereumDisplayFormat, 'providerName' | 'intent'>,
    { index, callee }: DisplayFormatSubcall,
): DisplayFormatRow[] => [
    {
        type: 'subcallProvider',
        subcall: { index },
        values: [
            displayFormat.providerName
                ? { type: 'text', text: displayFormat.providerName }
                : { type: 'address', address: toAddress(callee) },
        ],
    },
    {
        type: 'subcallIntent',
        subcall: { index },
        values: [{ type: 'text', text: displayFormat.intent }],
    },
];

const resolveRows = (
    field: EthereumDisplayFormatField,
    context: RowContext,
): DisplayFormatRow[] => {
    if (field.formatter === 'FORMATTER_CALLDATA') {
        return getDisplayFormatSubcalls(field, context.walkPath).flatMap(subcall => {
            const displayFormat = !context.isSubcall && findSubcallDisplayFormat(subcall, context);
            if (!displayFormat) {
                return getRawSubcallRows(field, subcall);
            }

            try {
                const parameters = parseDisplayFormatCalldata(
                    displayFormat.parameters,
                    subcall.arguments,
                );
                const subcallContext: RowContext = {
                    ...context,
                    // `@.to` is the callee; `@.from` and `@.value` depend on how the wrapper
                    // makes the call.
                    walkPath: createDisplayFormatPathWalker(parameters, { to: subcall.callee }),
                    isSubcall: true,
                };
                const fieldRows = displayFormat.fields.flatMap(subcallField =>
                    resolveRows(subcallField, subcallContext),
                );

                return [
                    ...getSubcallHeaderRows(displayFormat, subcall),
                    ...fieldRows.map(row => ({ ...row, subcall: { index: subcall.index } })),
                ];
            } catch {
                return getRawSubcallRows(field, subcall);
            }
        });
    }

    const value = context.walkPath(field.path);
    const elements = Array.isArray(value) ? value : [value];

    return [
        {
            type: 'field',
            label: field.label,
            values: elements.map(element => formatValue(element, field, context.walkPath)),
        },
    ];
};

/**
 * Evaluates the clear-signing definition of a contract call against the transaction, the way
 * the device does before showing it. Returns `undefined` when the call cannot be displayed
 * with this definition.
 */
export const resolveDisplayFormat = (
    displayFormat: EthereumDisplayFormat,
    transaction: DisplayFormatTransaction,
    options: ResolveDisplayFormatOptions = {},
): ResolvedDisplayFormat | undefined => {
    try {
        const data = hexToDisplayFormatBytes(transaction.data);
        if (!data || data.length < SELECTOR_SIZE) {
            return undefined;
        }
        const selector = bytesToHex(data.subarray(0, SELECTOR_SIZE));
        if (selector !== displayFormat.functionSignature.toLowerCase()) {
            return undefined;
        }

        const parameters = parseDisplayFormatCalldata(
            displayFormat.parameters,
            data.subarray(SELECTOR_SIZE),
        );
        const context: RowContext = {
            chainId: displayFormat.chainId,
            subcallDisplayFormats: options.subcallDisplayFormats ?? [],
            wrappedNativeAddress: getWrappedNativeContract(options.networkSymbol),
            walkPath: createDisplayFormatPathWalker(parameters, {
                from: toContainerAddress(transaction.from),
                to: toContainerAddress(transaction.to),
                value: transaction.value,
            }),
            isSubcall: false,
        };

        return {
            contractAddress: getAddress(displayFormat.address),
            providerName: displayFormat.providerName,
            intent: displayFormat.intent,
            rows: displayFormat.fields.flatMap(field => resolveRows(field, context)),
        };
    } catch {
        return undefined;
    }
};
