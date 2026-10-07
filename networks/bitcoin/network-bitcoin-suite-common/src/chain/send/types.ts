import type { AccountType, NetworkFeature } from '@trezor/network-module-suite-common-types';

export type BitcoinSendConfig = {
    decimals: number;

    /** Whether the network supports a feature for accounts of the type. */
    hasAccountFeature: (accountType: AccountType, feature: NetworkFeature) => boolean;
};

/** What Bitcoin sending needs from the app, beyond Connect. */
export type BitcoinSendAppDeps = {
    /** The locktime for the date and time the user picked, in the app's own input format. */
    datetimeToLocktime: (datetime: string) => number | undefined;
};
