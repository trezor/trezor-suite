import {
    type AssetAccount,
    type AssetAccountKey,
    type WalletAssetKey,
} from '@suite-common/wallet-core';
import { BigNumber } from '@trezor/utils';

export const sumAssetAccounts = (assetAccounts: readonly AssetAccount[]) => ({
    cryptoBalance: assetAccounts.reduce(
        (total, assetAccount) => total.plus(assetAccount.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: assetAccounts.find(assetAccount => assetAccount.tokenInfo !== undefined)?.tokenInfo,
});

export type HeldAssetAccounts = readonly [AssetAccount, ...AssetAccount[]];

/** The accounts holding each asset of the wallet, one entry per asset and network. */
export const groupAssetAccountsByAssetKey = (
    assetAccounts: readonly AssetAccount[],
): ReadonlyMap<WalletAssetKey, HeldAssetAccounts> => {
    const byKey = new Map<WalletAssetKey, [AssetAccount, ...AssetAccount[]]>();

    assetAccounts.forEach(assetAccount => {
        const held = byKey.get(assetAccount.assetKey);

        if (held === undefined) {
            byKey.set(assetAccount.assetKey, [assetAccount]);
        } else {
            held.push(assetAccount);
        }
    });

    return byKey;
};

type PartitionedAssetAccounts = {
    shown: readonly AssetAccount[];
    hidden: readonly AssetAccount[];
};

export const partitionAssetAccounts = (
    assetAccounts: readonly AssetAccount[],
    hiddenAccounts: ReadonlySet<AssetAccountKey>,
): PartitionedAssetAccounts => {
    const shown: AssetAccount[] = [];
    const hidden: AssetAccount[] = [];

    assetAccounts.forEach(assetAccount => {
        (hiddenAccounts.has(assetAccount.assetAccountKey) ? hidden : shown).push(assetAccount);
    });

    return { shown, hidden };
};
