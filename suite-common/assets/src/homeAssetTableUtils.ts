import { type AssetAccount } from '@suite-common/wallet-core';
import { BigNumber } from '@trezor/utils';

export const sumAssetAccounts = (assetAccounts: readonly AssetAccount[]) => ({
    cryptoBalance: assetAccounts.reduce(
        (total, assetAccount) => total.plus(assetAccount.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: assetAccounts.find(assetAccount => assetAccount.tokenInfo !== undefined)?.tokenInfo,
});
