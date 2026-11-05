import { type TokenAddress, type TokenSymbol, toTokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AssetAccount, type WalletAssetKey } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const sumAssetAccounts = (assetAccounts: readonly AssetAccount[]) => ({
    cryptoBalance: assetAccounts.reduce(
        (total, assetAccount) => total.plus(assetAccount.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: assetAccounts.find(assetAccount => assetAccount.tokenInfo !== undefined)?.tokenInfo,
});

export type WalletAsset = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: BigNumber;
    amount: string;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
    accountCount: number;
};

/** One row per asset the accounts hold between them, as the Home table and an account's list show it. */
export const groupWalletAssets = (
    assetAccounts: readonly AssetAccount[],
): ReadonlyMap<WalletAssetKey, WalletAsset> => {
    const byKey = new Map<WalletAssetKey, [AssetAccount, ...AssetAccount[]]>();

    assetAccounts.forEach(assetAccount => {
        const held = byKey.get(assetAccount.assetKey);

        if (held === undefined) {
            byKey.set(assetAccount.assetKey, [assetAccount]);
        } else {
            held.push(assetAccount);
        }
    });

    const assets = new Map<WalletAssetKey, WalletAsset>();

    byKey.forEach((held, assetKey) => {
        const [{ symbol, contractAddress }] = held;
        const { cryptoBalance, tokenInfo } = sumAssetAccounts(held);

        assets.set(assetKey, {
            assetKey,
            symbol,
            contractAddress,
            cryptoBalance,
            amount: cryptoBalance.toFixed(),
            tokenSymbol: tokenInfo?.symbol === undefined ? null : toTokenSymbol(tokenInfo.symbol),
            tokenDecimals: tokenInfo?.decimals,
            accountCount: held.filter(assetAccount => isPositiveBalance(assetAccount.cryptoBalance))
                .length,
        });
    });

    return assets;
};

/** How many rows the Home asset table shows before it folds, on desktop and mobile alike. */
export const HOME_ASSET_ROW_LIMIT = 8;

type GetHomeAssetRowLimitParams = {
    isFoldable: boolean;
    isExpanded: boolean;
};

export const getHomeAssetRowLimit = ({ isFoldable, isExpanded }: GetHomeAssetRowLimitParams) =>
    isFoldable && !isExpanded ? HOME_ASSET_ROW_LIMIT : undefined;
