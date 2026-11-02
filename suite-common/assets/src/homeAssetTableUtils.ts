import { type AssetAccount } from '@suite-common/wallet-core';
import { BigNumber } from '@trezor/utils';

export const sumAssetAccounts = (assetAccounts: readonly AssetAccount[]) => ({
    cryptoBalance: assetAccounts.reduce(
        (total, assetAccount) => total.plus(assetAccount.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: assetAccounts.find(assetAccount => assetAccount.tokenInfo !== undefined)?.tokenInfo,
});

/** How many rows the Home asset table shows before it folds, on desktop and mobile alike. */
export const HOME_ASSET_ROW_LIMIT = 8;

type GetHomeAssetRowLimitParams = {
    isFoldable: boolean;
    isExpanded: boolean;
};

export const getHomeAssetRowLimit = ({ isFoldable, isExpanded }: GetHomeAssetRowLimitParams) =>
    isFoldable && !isExpanded ? HOME_ASSET_ROW_LIMIT : undefined;
