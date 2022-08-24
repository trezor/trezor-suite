import { Network } from '@suite-common/wallet-config';
import { FeeLevel, PROTO } from '@trezor/connect';

export interface WalletSettings {
    localCurrency: string;
    discreetMode: boolean;
    enabledNetworks: Network['symbol'][];
    bitcoinAmountUnit: PROTO.AmountUnit;
    lastUsedFeeLevel: {
        [key: string]: Omit<FeeLevel, 'blocks'>; // Key: Network['symbol']
    };
}
