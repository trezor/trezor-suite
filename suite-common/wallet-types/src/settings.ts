import { Network } from '@suite-common/wallet-config';
import { FeeLevel, PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export enum AddressDisplayOptions {
    ORIGINAL = 'original',
    CHUNKED = 'chunked',
}

export interface WalletSettings {
    localCurrency: FiatCurrencyCode;
    discreetMode: boolean;
    enabledNetworks: Network['symbol'][];
    bitcoinAmountUnit: PROTO.AmountUnit;
    lastUsedFeeLevel: {
        [key: string]: Omit<FeeLevel, 'blocks'>; // Key: Network['symbol']
    };
}
