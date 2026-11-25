import { BigNumber } from '@trezor/utils';

import { type AssetAccount } from './assetAccountsSelectors';

export const sumAssetAccounts = (assetAccounts: readonly AssetAccount[]) => ({
    cryptoBalance: assetAccounts.reduce(
        (total, assetAccount) => total.plus(assetAccount.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: assetAccounts.find(assetAccount => assetAccount.tokenInfo !== undefined)?.tokenInfo,
});

/** How many rows an asset table shows before it folds, on desktop and mobile alike. */
export const ASSET_TABLE_ROW_LIMIT = 8;

type GetAssetTableRowLimitParams = {
    isFoldable: boolean;
    isExpanded: boolean;
};

export const getAssetTableRowLimit = ({ isFoldable, isExpanded }: GetAssetTableRowLimitParams) =>
    isFoldable && !isExpanded ? ASSET_TABLE_ROW_LIMIT : undefined;
