import type { PublicClient } from 'viem';

import { getChainId } from '../utils/client';

const ARC_TESTNET_CHAIN_ID = 5042002;

/**
 * Contracts worth checking a balance on without being asked. Enumerating an address's tokens needs
 * a log scan, which is expensive enough that paying it just to answer "is this account empty"
 * during discovery is not worth it; reading a handful of balances is a single batched call. A token
 * outside this list still shows up once transactions are loaded, or when added by hand.
 */
const KNOWN_TOKENS: Record<number, readonly `0x${string}`[]> = {
    [ARC_TESTNET_CHAIN_ID]: [
        '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', // EURC
        '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF', // Circle wrapped BTC
    ],
};

const NONE: readonly `0x${string}`[] = [];

export const getKnownTokens = async (client: PublicClient): Promise<readonly `0x${string}`[]> => {
    try {
        return KNOWN_TOKENS[await getChainId(client)] ?? NONE;
    } catch {
        return NONE;
    }
};
