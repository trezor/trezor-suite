import type { AccountTransaction } from '@trezor/connect-common';
import type {
    AccountType,
    ChainSendAccount,
    NetworkFeature,
} from '@trezor/network-module-suite-common-types';

export type BitcoinSendConfig = {
    decimals: number;

    /** Whether the network supports a feature for accounts of the type. */
    hasAccountFeature: (accountType: AccountType, feature: NetworkFeature) => boolean;
};

/** What Bitcoin sending needs from the app, beyond Connect. */
export type BitcoinSendAppDeps = {
    /** The locktime for the date and time the user picked, in the app's own input format. */
    datetimeToLocktime: (datetime: string) => number | undefined;

    /**
     * The account's transactions the wallet keeps. A replacement (RBF) on a coinjoin or taproot
     * account signs against the original from here, so the backend is not asked which one is
     * replaced.
     */
    getAccountTransactions: (account: ChainSendAccount) => readonly AccountTransaction[];
};
