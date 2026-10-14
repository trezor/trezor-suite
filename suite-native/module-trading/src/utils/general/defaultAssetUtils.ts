import type { CryptoId } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';
import { type SectionListData, toCaseAwareCryptoId } from '@suite-native/trading-atoms';
import { type MyAsset, type TradeableAsset } from '@suite-native/trading-types';

export type OwnedAssetMatch = {
    cryptoId: CryptoId;
    account: Account;
};

export const findTradeableAssetByCryptoIds = (
    assets: TradeableAsset[],
    cryptoIds: readonly CryptoId[],
): TradeableAsset | undefined => {
    for (const cryptoId of cryptoIds) {
        const asset = assets.find(tradeableAsset => tradeableAsset.cryptoId === cryptoId);

        if (asset) {
            return asset;
        }
    }

    return undefined;
};

export const findOwnedAssetByCryptoIds = (
    myAssets: SectionListData<MyAsset, Account>,
    cryptoIds: readonly CryptoId[],
): OwnedAssetMatch | undefined => {
    for (const cryptoId of cryptoIds) {
        const caseAwareCryptoId = toCaseAwareCryptoId(cryptoId);
        const accountSection = myAssets.find(({ data }) =>
            data.some(myAsset => myAsset.isEnabled && myAsset.cryptoId === caseAwareCryptoId),
        );

        if (accountSection) {
            return { cryptoId: caseAwareCryptoId, account: accountSection.sectionData };
        }
    }

    return undefined;
};
