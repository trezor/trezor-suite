import type { NetworkSymbol } from '@trezor/network-module-types';

import type { AccountType } from '../SuiteCommonNetworkConfig';

export type AddressRef = {
    readonly address: string;
    readonly path: string;
};

export type OpenAccountAddresses = {
    readonly change: readonly AddressRef[];
    readonly used: readonly AddressRef[];
    readonly unused: readonly AddressRef[];
};

/**
 * The account as the app holds it, described only by what network families may read from it.
 *
 * Families narrow it into their own account type and validate what they need, so the network layer
 * never depends on the app's wallet types. `misc` stays `unknown` because only the owning family
 * knows its shape.
 */
export type OpenAccount = {
    readonly symbol: NetworkSymbol;
    readonly accountType: AccountType;
    readonly index: number;
    readonly path: string;
    readonly descriptor: string;
    readonly addresses?: OpenAccountAddresses;
    readonly misc?: unknown;
};
