import type { PublicClient } from 'viem';

import { getChainId } from '../utils/client';

// Connect hardcodes 18 decimals for every EVM network, and so does this worker's getInfo.
export const NATIVE_DECIMALS = 18;

export type NativeLogSource = {
    address: `0x${string}`;
    decimals: number;
};

const ARC_CHAIN_ID = 5042;
const ARC_TESTNET_CHAIN_ID = 5042002;

// Arc mirrors native USDC movements into ERC-20 `Transfer` logs, which is what makes plain value
// transfers discoverable by log scan at all. Two contracts emit them: a sentinel carrying the
// native 18-decimal amount, and the 6-decimal ERC-20 face of native USDC. Neither is a token held
// alongside the native balance, so both are kept out of token discovery and folded into the native
// amount instead. Ordered by preference: when one movement shows up on both, the sentinel wins
// because it carries the unrounded amount.
const ARC_NATIVE_LOG_SOURCES: readonly NativeLogSource[] = [
    { address: '0xfffffffffffffffffffffffffffffffffffffffe', decimals: NATIVE_DECIMALS },
    { address: '0x3600000000000000000000000000000000000000', decimals: 6 },
];

const NATIVE_LOG_SOURCES: Record<number, readonly NativeLogSource[]> = {
    [ARC_CHAIN_ID]: ARC_NATIVE_LOG_SOURCES,
    [ARC_TESTNET_CHAIN_ID]: ARC_NATIVE_LOG_SOURCES,
};

const NO_SOURCES: readonly NativeLogSource[] = [];

export const getNativeLogSources = async (
    client: PublicClient,
): Promise<readonly NativeLogSource[]> => {
    try {
        return NATIVE_LOG_SOURCES[await getChainId(client)] ?? NO_SOURCES;
    } catch {
        return NO_SOURCES;
    }
};

export const toNativeAmount = (value: bigint, decimals: number) =>
    decimals >= NATIVE_DECIMALS
        ? value / 10n ** BigInt(decimals - NATIVE_DECIMALS)
        : value * 10n ** BigInt(NATIVE_DECIMALS - decimals);
