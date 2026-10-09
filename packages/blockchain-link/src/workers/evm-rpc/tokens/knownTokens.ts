import type { PublicClient } from 'viem';

import { ARC_CHAIN_ID, ARC_TESTNET_CHAIN_ID } from '../constants';
import { getChainId } from '../utils/client';

/**
 * Contracts worth checking a balance on without being asked, per chain id. Enumerating an address's
 * tokens needs a log scan, which is expensive enough that a token listing reads this handful of
 * balances in one batched call instead. A token outside this list still shows up once transactions
 * are loaded, or when added by hand.
 *
 * Account discovery reads these balances too, so an address that only ever received one of them is
 * still found. On Arc these are the Circle tokens the Arc token definitions verify, except USDC,
 * which is the native balance.
 *
 * @see https://docs.arc.io/arc/references/contract-addresses
 */
const KNOWN_TOKENS: Record<number, readonly `0x${string}`[]> = {
    [ARC_CHAIN_ID]: [
        '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1', // EURC
        '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0', // cirBTC
        '0x128cC466B61f542da60c70e3aA11c10e19B84EDB', // WETH
    ],
    [ARC_TESTNET_CHAIN_ID]: [
        '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', // EURC
        '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF', // cirBTC
        '0x2c4047028a72803939b6fb674D01bC059B5C4961', // WETH
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
