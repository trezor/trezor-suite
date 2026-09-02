import { type AccountKey } from '@suite-common/wallet-types';

import { type AssetGroupOption } from '../types';

export type AssetGroupKey = `${AccountKey}:${AssetGroupOption['type']}`;

export const getAssetGroupKey = (
    accountKey: AccountKey,
    groupType: AssetGroupOption['type'],
): AssetGroupKey => `${accountKey}:${groupType}`;
