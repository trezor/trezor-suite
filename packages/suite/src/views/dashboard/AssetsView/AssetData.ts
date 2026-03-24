import { type Network } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';

import { type Account } from 'src/types/wallet';

export type AssetData = {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: AmountUnit;
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    isStakeNetwork?: boolean;
    accounts: Account[];
};
