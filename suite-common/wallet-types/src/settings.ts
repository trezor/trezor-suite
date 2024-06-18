import { Network } from '@suite-common/wallet-config';
import { FeeLevel, PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export const AddressDisplayOptions = {
    ORIGINAL: 'original',
    CHUNKED: 'chunked',
} as const;

export type AddressDisplayOptions =
    (typeof AddressDisplayOptions)[keyof typeof AddressDisplayOptions];

export const DefaultWalletLoading = {
    STANDARD: 'standard',
    PASSPHRASE: 'passphrase',
} as const;

export type DefaultWalletLoading = (typeof DefaultWalletLoading)[keyof typeof DefaultWalletLoading];

export interface WalletSettings {
    localCurrency: FiatCurrencyCode;
    discreetMode: boolean;
    enabledNetworks: Network['symbol'][];
    bitcoinAmountUnit: PROTO.AmountUnit;
    lastUsedFeeLevel: {
        [key: string]: Omit<FeeLevel, 'blocks'>; // Key: Network['symbol']
    };
}
