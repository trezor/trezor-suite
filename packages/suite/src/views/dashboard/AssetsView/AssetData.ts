import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';

export type AssetData = {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: AmountUnit;
    assetTokens: TokenInfo[];
    accounts: Account[];
};
