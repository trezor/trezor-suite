import { type VersionArray, typedObjectKeys, versionUtils } from '@trezor/utils';

import { hexToDisplayFormatBytes } from './ethereumDisplayFormat';
import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '../types/api/ethereum/displayFormat';

// What each firmware release does with a display format, pinned from trezor-firmware
// `core/src/apps/ethereum/clear_signing.py` at the release tags. Older firmware misreads arrays of
// static tuples and `bytes[]`, so Suite does not predict its screens at all.
const MIN_FIRMWARE = '2.12.4';

type Formatter = EthereumDisplayFormatField['formatter'];
type AbiType = Extract<EthereumDisplayFormatAbiValue, { type: 'atomic' }>['abiType'];

type FirmwareRange = {
    min?: string;
    // The release that dropped the behaviour.
    below?: string;
};

const FORMATTERS: Record<Formatter, FirmwareRange> = {
    FORMATTER_ADDRESS_NAME: {},
    FORMATTER_AMOUNT: {},
    FORMATTER_TOKEN_AMOUNT: {},
    FORMATTER_UNIT: {},
    FORMATTER_RAW: {},
    FORMATTER_DATE: {},
    FORMATTER_CALLDATA: {},
    FORMATTER_ENUM: {},
    FORMATTER_DURATION: { min: '2.13.0' },
};

const FEATURES = {
    // Any tuple and array tree within the nesting limits. Older firmware reads only tuples of
    // leaves and arrays of those, and trusts the definition's flag for a top-level tuple.
    recursiveAbi: { min: '2.13.0' },
    // `amount >= threshold` is shown as the threshold message; older firmware compares with `>`.
    inclusiveThreshold: { min: '2.13.0' },
    thresholdMessage: { min: '2.13.0' },
    nativeCurrencyAddresses: { min: '2.13.0' },
    // A token amount whose token the definition does not name is shown in an unknown token.
    tokenlessAmount: { min: '2.13.1' },
    // Built-in 1inch and Uniswap definitions, which win over any downloaded one.
    swapBuiltIns: { below: '2.12.5' },
} satisfies Record<string, FirmwareRange>;

export type DisplayFormatCapabilities = {
    formatters: ReadonlySet<Formatter>;
} & Record<keyof typeof FEATURES, boolean>;

const ATOMIC_ABI_TYPES: ReadonlySet<string> = new Set<AbiType>([
    'ABI_ADDRESS',
    'ABI_BOOL',
    'ABI_INT160',
    'ABI_UINT8',
    'ABI_UINT16',
    'ABI_UINT24',
    'ABI_UINT32',
    'ABI_UINT40',
    'ABI_UINT48',
    'ABI_UINT64',
    'ABI_UINT72',
    'ABI_UINT96',
    'ABI_UINT112',
    'ABI_UINT120',
    'ABI_UINT128',
    'ABI_UINT160',
    'ABI_UINT248',
    'ABI_UINT256',
    'ABI_BYTES4',
    'ABI_BYTES8',
    'ABI_BYTES16',
    'ABI_BYTES20',
    'ABI_BYTES32',
]);
const DYNAMIC_ABI_TYPES: ReadonlySet<string> = new Set<AbiType>(['ABI_BYTES', 'ABI_STRING']);
const MAX_ABI_NESTING = 8;
const MAX_NESTED_ARRAYS = 2;
const SELECTOR_SIZE = 4;

const isInRange = (firmwareVersion: VersionArray | string, { min, below }: FirmwareRange) =>
    (!min || versionUtils.isNewerOrEqual(firmwareVersion, min)) &&
    (!below || !versionUtils.isNewerOrEqual(firmwareVersion, below));

/** What the firmware supports, or `undefined` when Suite does not predict its screens. */
export const getDisplayFormatCapabilities = (
    firmwareVersion: VersionArray | string,
): DisplayFormatCapabilities | undefined => {
    if (!versionUtils.isNewerOrEqual(firmwareVersion, MIN_FIRMWARE)) {
        return undefined;
    }
    const supports = (range: FirmwareRange) => isInRange(firmwareVersion, range);

    return {
        formatters: new Set(
            typedObjectKeys(FORMATTERS).filter(formatter => supports(FORMATTERS[formatter])),
        ),
        recursiveAbi: supports(FEATURES.recursiveAbi),
        inclusiveThreshold: supports(FEATURES.inclusiveThreshold),
        thresholdMessage: supports(FEATURES.thresholdMessage),
        nativeCurrencyAddresses: supports(FEATURES.nativeCurrencyAddresses),
        tokenlessAmount: supports(FEATURES.tokenlessAmount),
        swapBuiltIns: supports(FEATURES.swapBuiltIns),
    };
};

const isLeafSupported = (value: EthereumDisplayFormatAbiValue) => {
    switch (value.type) {
        case 'atomic':
            return ATOMIC_ABI_TYPES.has(value.abiType);
        case 'dynamic':
            return DYNAMIC_ABI_TYPES.has(value.abiType);
        default:
            return false;
    }
};

const isTupleOfLeaves = (value: EthereumDisplayFormatAbiValue) =>
    value.type === 'tuple' && value.fields.length > 0 && value.fields.every(isLeafSupported);

// Firmware < 2.13.0: a leaf, a tuple of leaves, or an array of a leaf, of a tuple of leaves or of
// an array of leaves.
const isLegacyAbiValueSupported = (value: EthereumDisplayFormatAbiValue) => {
    switch (value.type) {
        case 'atomic':
        case 'dynamic':
            return isLeafSupported(value);
        case 'tuple':
            return isTupleOfLeaves(value);
        case 'array': {
            const { element } = value;

            return (
                isLeafSupported(element) ||
                isTupleOfLeaves(element) ||
                (element.type === 'array' && isLeafSupported(element.element))
            );
        }
        default:
            return false;
    }
};

const isAbiValueSupported = (
    value: EthereumDisplayFormatAbiValue,
    depth = 0,
    arrays = 0,
): boolean => {
    if (depth > MAX_ABI_NESTING || arrays > MAX_NESTED_ARRAYS) {
        return false;
    }

    switch (value.type) {
        case 'atomic':
        case 'dynamic':
            return isLeafSupported(value);
        case 'tuple':
            return (
                value.fields.length > 0 &&
                value.fields.every(field => isAbiValueSupported(field, depth + 1, arrays))
            );
        case 'array':
            return isAbiValueSupported(value.element, depth + 1, arrays + 1);
        default:
            return false;
    }
};

const isFieldSupported = (
    { formatter, enumValues, calleePath, selector }: EthereumDisplayFormatField,
    { formatters }: DisplayFormatCapabilities,
) => {
    if (!formatters.has(formatter)) {
        return false;
    }
    if (formatter === 'FORMATTER_ENUM') {
        const keys = enumValues.map(({ key }) => key);

        return keys.length > 0 && new Set(keys).size === keys.length;
    }
    if (formatter === 'FORMATTER_CALLDATA') {
        return (
            !!calleePath &&
            (selector === undefined || hexToDisplayFormatBytes(selector)?.length === SELECTOR_SIZE)
        );
    }

    return true;
};

/**
 * Whether the firmware accepts the definition when it reads it. The device blind-signs a call
 * whose definition it rejects, and shows an embedded call with such a definition raw.
 */
export const isDisplayFormatSupported = (
    { functionSignature, parameters, fields }: EthereumDisplayFormat,
    capabilities: DisplayFormatCapabilities,
) =>
    hexToDisplayFormatBytes(functionSignature)?.length === SELECTOR_SIZE &&
    parameters.every(parameter =>
        capabilities.recursiveAbi
            ? isAbiValueSupported(parameter)
            : isLegacyAbiValueSupported(parameter),
    ) &&
    fields.every(field => isFieldSupported(field, capabilities));
