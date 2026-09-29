import type { PublicClient } from 'viem';

import { getChainId } from '../utils/client';

/**
 * Contracts worth checking a balance on without being asked, per chain id. A plain RPC node cannot
 * enumerate an address's tokens, so this list is what makes a token show up on an account nobody
 * has added it to by hand. Reading a handful of balances is a single batched call.
 */
const KNOWN_TOKENS: Record<number, readonly `0x${string}`[]> = {};

const NONE: readonly `0x${string}`[] = [];

export const getKnownTokens = async (client: PublicClient): Promise<readonly `0x${string}`[]> => {
    try {
        return KNOWN_TOKENS[await getChainId(client)] ?? NONE;
    } catch {
        return NONE;
    }
};
