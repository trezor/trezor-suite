import type { ChainSendAccount } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import type { StellarAssetRef } from '@trezor/network-stellar/types';

export type StellarSendConfig = {
    decimals: number;
    isTestnet: boolean;

    /** The coin symbol shown to the user, for error messages. */
    displaySymbol: string;
};

/** What Stellar sending needs from the app, beyond Connect. */
export type StellarSendAppDeps = {
    /**
     * The backend Connect is connected to for the network. Soroban transfers are simulated and
     * prepared against it directly.
     */
    getStellarBackendUrl: (symbol: NetworkSymbol) => string | undefined;

    /** The classic asset a Stellar Asset Contract wraps, from the token definitions the app keeps. */
    resolveStellarContractId: (contractId: string) => Promise<StellarAssetRef | undefined>;
};

type StellarAccountMisc = { stellarSequence: string };

/** The family data of an account this network already checked to be its own. */
export const readStellarAccountMisc = (account: ChainSendAccount) =>
    account.misc as StellarAccountMisc;
