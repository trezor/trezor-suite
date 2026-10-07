import type { ChainSendAccount } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type SolanaSendConfig = {
    decimals: number;

    /** The coin symbol shown to the user, for error messages. */
    displaySymbol: string;

    /** Coin kept back for fees when the user enables the reserve, in units. */
    nativeTokenReserve?: string;
};

export type SolanaBlockInfo = { blockHash: string; blockHeight: number };

/** What Solana sending needs from the app, beyond Connect. */
export type SolanaSendAppDeps = {
    /**
     * The latest block the app knows of. Fee estimation needs one but does not depend on which, so
     * composing does not ask the backend for a fresh one.
     */
    getSolanaBlockInfo: (symbol: NetworkSymbol) => SolanaBlockInfo;
};

type SolanaAccountMisc = { rent?: number };

/** The family data of an account this network already checked to be its own. */
export const readSolanaAccountMisc = (account: ChainSendAccount) =>
    account.misc as SolanaAccountMisc | undefined;
