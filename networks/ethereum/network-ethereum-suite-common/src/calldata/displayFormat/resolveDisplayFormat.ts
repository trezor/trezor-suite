import { bytesToBigInt, bytesToHex, getAddress, hexToBytes, isAddress } from 'viem';

import {
    type DisplayFormatAbiValue,
    type DisplayFormatCapabilities,
    type DisplayFormatPathWalker,
    DisplayFormatRejectedError,
    type DisplayFormatSubcall,
    type EthereumDisplayFormat,
    type EthereumDisplayFormatField,
    createDisplayFormatPathWalker,
    getBuiltInDisplayFormat,
    getDisplayFormatCapabilities,
    getDisplayFormatSubcalls,
    getEthereumDeviceAccountName,
    hexToDisplayFormatBytes,
    isDisplayFormatSupported,
    isSwapBuiltInDisplayFormatCall,
    parseDisplayFormatCalldata,
} from '@trezor/connect-common';
import type { VersionArray } from '@trezor/utils';

const SELECTOR_SIZE = 4;
const ADDRESS_SIZE = 20;

export type DisplayFormatValue =
    | { type: 'address'; address: string }
    | { type: 'nativeAmount'; amount: string }
    // Without `tokenAddress` the definition does not say which token the amount is in.
    | { type: 'tokenAmount'; amount: string; tokenAddress?: string }
    | { type: 'aboveThreshold'; message?: string; tokenAddress?: string }
    | { type: 'date'; timestamp: number }
    | { type: 'text'; text: string };

// Rows of an embedded call carry its position, which the device puts in front of their labels.
// `index` is set when the call is one of several (a multicall). The raw rows of a call embedded
// in an embedded call keep their own position, prefixed with the `outer` one.
export type DisplayFormatSubcallPosition = { index?: number; outer?: { index?: number } };

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
    // Derivation path of the signing account, which the device names for `@.from`.
    fromPath: string;
    to: string;
    value: bigint;
    data: string;
};

export type ResolveDisplayFormatOptions = {
    // Definitions of the calls the transaction embeds, downloaded along with its own.
    subcallDisplayFormats?: EthereumDisplayFormat[];
    // Of the device that signs: definitions it cannot parse are not clear-signed.
    firmwareVersion: VersionArray | string;
};

type RowContext = {
    chainId: number;
    subcallDisplayFormats: EthereumDisplayFormat[];
    capabilities: DisplayFormatCapabilities;
    walkPath: DisplayFormatPathWalker;
    // Inside an embedded call, further embedded calls are shown raw, as the device does.
    isSubcall: boolean;
};

// The device decodes the call with a built-in definition Suite does not mirror.
class UnmirroredDisplayFormatError extends Error {}

const toInteger = (value: DisplayFormatAbiValue) => {
    if (value instanceof Uint8Array) return bytesToBigInt(value);
    if (typeof value === 'bigint') return value;

    throw new DisplayFormatRejectedError('not an integer');
};

// Definitions are downloaded, so their values are checked like calldata.
const parseDefinitionHex = (hex: string) => {
    const bytes = hexToDisplayFormatBytes(hex);
    if (!bytes) {
        throw new DisplayFormatRejectedError('invalid hex in the definition');
    }

    return bytes;
};

const toAddress = (bytes: Uint8Array) => {
    if (bytes.length !== ADDRESS_SIZE) {
        throw new DisplayFormatRejectedError('not an address');
    }

    return getAddress(bytesToHex(bytes));
};

// Python's `{:g}`: six significant digits, no trailing zeros. Python picks the notation by the
// exponent after rounding, which is the one `toExponential` reports.
const formatGeneral = (value: number) => {
    const [mantissa = '', exponentText] = value.toExponential(5).split('e');
    const exponent = Number(exponentText);
    if (exponent < -4 || exponent >= 6) {
        const exponentDigits = String(Math.abs(exponent)).padStart(2, '0');

        return `${mantissa.replace(/\.?0+$/, '')}e${exponent < 0 ? '-' : '+'}${exponentDigits}`;
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
        throw new DisplayFormatRejectedError('negative duration');
    }
    const pad = (part: bigint) => part.toString().padStart(2, '0');

    return `${pad(seconds / 3600n)}:${pad((seconds / 60n) % 60n)}:${pad(seconds % 60n)}`;
};

const formatRaw = (value: DisplayFormatAbiValue): string => {
    if (typeof value === 'string') return value;
    if (value instanceof Uint8Array) return bytesToHex(value).slice(2);
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'bigint') return value.toString();

    throw new DisplayFormatRejectedError('not a raw value');
};

const resolveTokenAddress = (
    field: EthereumDisplayFormatField,
    { walkPath, capabilities }: RowContext,
) => {
    if (field.constTokenAddress) {
        return parseDefinitionHex(field.constTokenAddress);
    }
    if (!field.tokenPath) {
        if (!capabilities.tokenlessAmount) {
            throw new DisplayFormatRejectedError('token amount without a token');
        }

        return undefined;
    }
    const tokenAddress = walkPath(field.tokenPath);
    if (!(tokenAddress instanceof Uint8Array)) {
        throw new DisplayFormatRejectedError('token path does not resolve to an address');
    }

    return tokenAddress;
};

const isAboveThreshold = (
    amount: bigint,
    threshold: string,
    { inclusiveThreshold }: DisplayFormatCapabilities,
) => {
    const thresholdBytes = parseDefinitionHex(threshold);
    // An empty threshold is zero, so every amount is above it.
    const thresholdValue = thresholdBytes.length > 0 ? bytesToBigInt(thresholdBytes) : 0n;

    return inclusiveThreshold ? amount >= thresholdValue : amount > thresholdValue;
};

const formatTokenAmount = (
    value: DisplayFormatAbiValue,
    field: EthereumDisplayFormatField,
    context: RowContext,
): DisplayFormatValue => {
    if (typeof value !== 'bigint') {
        throw new DisplayFormatRejectedError('not an amount');
    }
    const { capabilities } = context;
    const amount = value.toString();
    const tokenAddress = resolveTokenAddress(field, context);
    const tokenAddressHex = tokenAddress && bytesToHex(tokenAddress).toLowerCase();
    const isNative =
        capabilities.nativeCurrencyAddresses &&
        !!tokenAddressHex &&
        field.nativeCurrencyAddresses.some(address => address.toLowerCase() === tokenAddressHex);
    const tokenAddressText = tokenAddress && !isNative ? toAddress(tokenAddress) : undefined;

    if (field.threshold !== undefined && isAboveThreshold(value, field.threshold, capabilities)) {
        return {
            type: 'aboveThreshold',
            // The device shows its own "Unlimited" in place of a missing or empty message.
            message: (capabilities.thresholdMessage && field.thresholdMessage) || undefined,
            tokenAddress: tokenAddressText,
        };
    }
    if (isNative) {
        return { type: 'nativeAmount', amount };
    }

    return { type: 'tokenAmount', amount, tokenAddress: tokenAddressText };
};

const formatValue = (
    value: DisplayFormatAbiValue,
    field: EthereumDisplayFormatField,
    context: RowContext,
): DisplayFormatValue => {
    switch (field.formatter) {
        case 'FORMATTER_ADDRESS_NAME':
            if (typeof value === 'string') return { type: 'text', text: value };
            if (value instanceof Uint8Array) return { type: 'address', address: toAddress(value) };
            throw new DisplayFormatRejectedError('not an address');
        case 'FORMATTER_AMOUNT':
            if (typeof value !== 'bigint') throw new DisplayFormatRejectedError('not an amount');

            return { type: 'nativeAmount', amount: value.toString() };
        case 'FORMATTER_TOKEN_AMOUNT':
            return formatTokenAmount(value, field, context);
        case 'FORMATTER_UNIT':
            if (typeof value !== 'bigint') throw new DisplayFormatRejectedError('not a number');

            return { type: 'text', text: formatUnit(value, field) };
        case 'FORMATTER_DATE': {
            const timestamp = Number(toInteger(value));
            if (!Number.isSafeInteger(timestamp * 1000)) {
                throw new DisplayFormatRejectedError('not a date');
            }

            return { type: 'date', timestamp };
        }
        case 'FORMATTER_DURATION':
            return { type: 'text', text: formatDuration(toInteger(value)) };
        case 'FORMATTER_ENUM': {
            const key = toInteger(value);
            const entry = field.enumValues.find(({ key: entryKey }) => BigInt(entryKey) === key);
            if (!entry) throw new DisplayFormatRejectedError('unknown enum value');

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

// Like the device: built-in definitions first, then the downloaded ones it can parse.
const findSubcallDisplayFormat = (
    { callee, selector }: DisplayFormatSubcall,
    { chainId, subcallDisplayFormats, capabilities }: RowContext,
) => {
    if (!selector) {
        return undefined;
    }
    const calleeHex = bytesToHex(callee);
    const selectorHex = bytesToHex(selector);
    const call = { chainId, address: calleeHex, functionSignature: selectorHex };
    const builtInDisplayFormat = getBuiltInDisplayFormat(call);
    if (builtInDisplayFormat) {
        return builtInDisplayFormat;
    }
    if (capabilities.swapBuiltIns && isSwapBuiltInDisplayFormatCall(call)) {
        throw new UnmirroredDisplayFormatError();
    }
    const downloadedDisplayFormat = subcallDisplayFormats.find(
        displayFormat =>
            displayFormat.chainId === chainId &&
            displayFormat.address.toLowerCase() === calleeHex &&
            displayFormat.functionSignature.toLowerCase() === selectorHex,
    );

    return downloadedDisplayFormat &&
        isDisplayFormatSupported(downloadedDisplayFormat, capabilities)
        ? downloadedDisplayFormat
        : undefined;
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
                    { isTupleFlagTrusted: !context.capabilities.recursiveAbi },
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
                    ...fieldRows.map(row => ({
                        ...row,
                        subcall: row.subcall
                            ? { ...row.subcall, outer: { index: subcall.index } }
                            : { index: subcall.index },
                    })),
                ];
            } catch (error) {
                // The device shows an embedded call it fails to decode raw, not the whole call.
                if (error instanceof DisplayFormatRejectedError) {
                    return getRawSubcallRows(field, subcall);
                }
                throw error;
            }
        });
    }

    const value = context.walkPath(field.path);
    const elements = Array.isArray(value) ? value : [value];

    return [
        {
            type: 'field',
            label: field.label,
            values: elements.map(element => formatValue(element, field, context)),
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
    { subcallDisplayFormats = [], firmwareVersion }: ResolveDisplayFormatOptions,
): ResolvedDisplayFormat | undefined => {
    const capabilities = getDisplayFormatCapabilities(firmwareVersion);
    if (!capabilities || !isDisplayFormatSupported(displayFormat, capabilities)) {
        return undefined;
    }
    const call = {
        chainId: displayFormat.chainId,
        address: displayFormat.address,
        functionSignature: displayFormat.functionSignature,
    };
    // The device decodes these with its own definitions, shown by Suite's dedicated reviews.
    if (
        getBuiltInDisplayFormat(call) ||
        (capabilities.swapBuiltIns && isSwapBuiltInDisplayFormatCall(call))
    ) {
        return undefined;
    }

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
            { isTupleFlagTrusted: !capabilities.recursiveAbi },
        );
        const context: RowContext = {
            chainId: displayFormat.chainId,
            subcallDisplayFormats,
            capabilities,
            walkPath: createDisplayFormatPathWalker(parameters, {
                from: getEthereumDeviceAccountName(transaction.fromPath),
                to: toContainerAddress(transaction.to),
                value: transaction.value,
            }),
            isSubcall: false,
        };

        return {
            contractAddress: toAddress(parseDefinitionHex(displayFormat.address)),
            providerName: displayFormat.providerName,
            intent: displayFormat.intent,
            rows: displayFormat.fields.flatMap(field => resolveRows(field, context)),
        };
    } catch (error) {
        if (
            error instanceof DisplayFormatRejectedError ||
            error instanceof UnmirroredDisplayFormatError
        ) {
            return undefined;
        }
        throw error;
    }
};
