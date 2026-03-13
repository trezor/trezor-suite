import { NetworkSymbol } from '@suite-common/wallet-config';
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

export interface WalletSettings {
    localCurrency: BaseCurrencyCode;
    discreetMode: boolean;
    enabledNetworks: NetworkSymbol[];
    hideSuspiciousTransactions: boolean;
    bitcoinAmountUnit: PROTO.AmountUnit;
    mevProtection: boolean;
    networkReserve: boolean;
    isAutoEjectEnabled: boolean;
}
