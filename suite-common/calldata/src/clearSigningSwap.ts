// Decodes swap legs from calldata. Mirrors firmware DisplayFormat field_definitions:
// https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing_definitions.py

import { decodeFunctionData, parseAbi } from 'viem';

import { MAX_CLEAR_SIGNING_DATA_LENGTH, ONEINCH_SWAP_SELECTOR } from './clearSigning';

export const NATIVE_CURRENCY = '__native__'; // sentinel token address for the native coin

// Sentinel addresses conventionally standing in for the chain's native currency;
// firmware's 1inch and LI.FI native-currency address lists are both exactly this.
const NATIVE_CURRENCY_ADDRESSES: ReadonlySet<string> = new Set([
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    '0x0000000000000000000000000000000000000000',
]);

export type ClearSignedSwapLeg = {
    amount: bigint;
    token: string;
};

export type DecodedClearSignedSwap = {
    send: ClearSignedSwapLeg;
    receive?: ClearSignedSwapLeg;
};

const normalizeToken = (address: string): string => {
    const lower = address.toLowerCase();

    return NATIVE_CURRENCY_ADDRESSES.has(lower) ? NATIVE_CURRENCY : lower;
};

// Low 20 bytes of a uint256-packed token argument.
const uintToAddress = (value: bigint): string => {
    const mask = (1n << 160n) - 1n;

    return `0x${(value & mask).toString(16).padStart(40, '0')}`;
};

const ONEINCH_SWAP_ABI = parseAbi([
    'function swap(address executor, (address srcToken, address dstToken, address srcReceiver, address dstReceiver, uint256 amount, uint256 minReturnAmount, uint256 flags) desc, bytes data)',
]);

// Argument indices mirror firmware parameter_definitions.
const ONEINCH_UNOSWAP_VARIANTS: Record<
    string,
    { abi: ReturnType<typeof parseAbi>; tokenArg: number; amountArg: number }
> = {
    '83800a8e': {
        abi: parseAbi([
            'function unoswap(uint256 token, uint256 amount, uint256 minReturn, uint256 dex)',
        ]),
        tokenArg: 0,
        amountArg: 1,
    },
    e2c95c82: {
        abi: parseAbi([
            'function unoswapTo(uint256 to, uint256 token, uint256 amount, uint256 minReturn, uint256 dex)',
        ]),
        tokenArg: 1,
        amountArg: 2,
    },
    '8770ba91': {
        abi: parseAbi([
            'function unoswap2(uint256 token, uint256 amount, uint256 minReturn, uint256 dex, uint256 dex2)',
        ]),
        tokenArg: 0,
        amountArg: 1,
    },
    '19367472': {
        abi: parseAbi([
            'function unoswap3(uint256 token, uint256 amount, uint256 minReturn, uint256 dex, uint256 dex2, uint256 dex3)',
        ]),
        tokenArg: 0,
        amountArg: 1,
    },
    ea76dddf: {
        abi: parseAbi([
            'function unoswapTo2(uint256 to, uint256 token, uint256 amount, uint256 minReturn, uint256 dex, uint256 dex2)',
        ]),
        tokenArg: 1,
        amountArg: 2,
    },
    f7a70056: {
        abi: parseAbi([
            'function unoswapTo3(uint256 to, uint256 token, uint256 amount, uint256 minReturn, uint256 dex, uint256 dex2, uint256 dex3)',
        ]),
        tokenArg: 1,
        amountArg: 2,
    },
};

const ONEINCH_ETH_UNOSWAP_SELECTORS: ReadonlySet<string> = new Set([
    'a76dfc3b', // ethUnoswap
    '89af926a', // ethUnoswap2
    '188ac35d', // ethUnoswap3
    '175accdc', // ethUnoswapTo
    '0f449d71', // ethUnoswapTo2
    '493189f0', // ethUnoswapTo3
]);

const decodeOneInchSwap = (data: `0x${string}`): DecodedClearSignedSwap => {
    const { args } = decodeFunctionData({ abi: ONEINCH_SWAP_ABI, data });
    const desc = args[1];

    return {
        send: { amount: desc.amount, token: normalizeToken(desc.srcToken) },
        receive: { amount: desc.minReturnAmount, token: normalizeToken(desc.dstToken) },
    };
};

type OneInchUnoswapVariant = (typeof ONEINCH_UNOSWAP_VARIANTS)[string];

const decodeOneInchUnoswap = (
    variant: OneInchUnoswapVariant,
    data: `0x${string}`,
): DecodedClearSignedSwap => {
    const args = decodeFunctionData({ abi: variant.abi, data }).args as readonly bigint[];
    const tokenArg = args[variant.tokenArg] as bigint;
    const amount = args[variant.amountArg] as bigint;

    return { send: { amount, token: normalizeToken(uintToAddress(tokenArg)) } };
};

// Selectors this decoder can extract legs from, split by receive-leg presence.
// Used by drift guards to keep this table consistent with the coverage definitions.
export const DECODABLE_SWAP_SELECTORS: { full: ReadonlySet<string>; partial: ReadonlySet<string> } =
    {
        full: new Set([ONEINCH_SWAP_SELECTOR]),
        partial: new Set([
            ...Object.keys(ONEINCH_UNOSWAP_VARIANTS),
            ...ONEINCH_ETH_UNOSWAP_SELECTORS,
        ]),
    };

export const decodeClearSignedSwap = (
    data?: string,
    value?: bigint,
): DecodedClearSignedSwap | null => {
    const hex = data?.replace(/^0x/i, '').toLowerCase();
    // Over the FW memory limit the device raw-signs, so decoding must not succeed
    // where getEvmClearSignedSwapCoverage reports no coverage.
    if (!hex || hex.length < 8 || hex.length > MAX_CLEAR_SIGNING_DATA_LENGTH * 2) {
        return null;
    }

    const selector = hex.slice(0, 8);
    const data0x = `0x${hex}` as const;

    try {
        if (selector === ONEINCH_SWAP_SELECTOR) {
            return decodeOneInchSwap(data0x);
        }
        const unoswapVariant = ONEINCH_UNOSWAP_VARIANTS[selector];
        if (unoswapVariant) {
            return decodeOneInchUnoswap(unoswapVariant, data0x);
        }
        if (ONEINCH_ETH_UNOSWAP_SELECTORS.has(selector)) {
            if (value === undefined) {
                return null;
            }

            return { send: { amount: value, token: NATIVE_CURRENCY } };
        }
    } catch {
        return null;
    }

    return null;
};
