import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { PROTO } from '@trezor/connect';

export const AddressDisplayOptions = {
    ORIGINAL: 'original',
    CHUNKED: 'chunked',
} as const;

export type AddressDisplayOptions =
    (typeof AddressDisplayOptions)[keyof typeof AddressDisplayOptions];

export const WalletType = {
    STANDARD: 'standard',
    PASSPHRASE: 'passphrase',
} as const;

export type WalletType = (typeof WalletType)[keyof typeof WalletType];

export type SuspiciousTransactionsFilter = 'showAll' | 'hideSuspicious' | 'showUnblurred';

/** How the home asset table is cut up: as one list, or a section per network. */
export type HomeAssetsTableGrouping = 'default' | 'networks';

export interface WalletSettings {
    localCurrency: BaseCurrencyCode;
    enabledNetworks: NetworkSymbol[];
    suspiciousTransactionsFilter: Partial<Record<NetworkSymbol, SuspiciousTransactionsFilter>>;
    bitcoinAmountUnit: PROTO.AmountUnit;
    mevProtection: boolean;
    networkReserve: boolean;
    isAutoEjectEnabled: boolean;
    addressDisplayType: AddressDisplayOptions;
    homeAssetsTableGrouping: HomeAssetsTableGrouping;
    areHomeAssetSmallBalancesShown: boolean;
}
