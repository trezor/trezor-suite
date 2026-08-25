import { type CryptoId } from 'invity-api';

import { getCryptoId, groupTradeableAssetsByTradability } from '@suite-common/trading';
import {
    type AccountKey,
    type BaseCurrencyAmount,
    type RatesByKey,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    type AccountWithOptionalLabel,
    type AccountWithTokensOption,
    type AssetGroupOption,
    type AssetPickerOption,
    type AssetRowOption,
} from 'src/components/suite/asset-picker/types';

export type AssetGroupKey = `${AccountKey}:${AssetGroupOption['type']}`;

export const getAssetGroupKey = (
    accountKey: AccountKey,
    groupType: AssetGroupOption['type'],
): AssetGroupKey => `${accountKey}:${groupType}`;

const isAssetRowOption = (option: AccountWithTokensOption): option is AssetRowOption =>
    option.type === 'account' || option.type === 'token';

type AccountRows = { account: AccountWithOptionalLabel; rows: AssetRowOption[] };

const groupRowsByAccount = (rows: readonly AssetRowOption[]) => {
    const rowsByAccount: AccountRows[] = [];
    let currentAccountRows: AccountRows | undefined;

    for (const row of rows) {
        if (row.account.key !== currentAccountRows?.account.key) {
            currentAccountRows = { account: row.account, rows: [] };
            rowsByAccount.push(currentAccountRows);
        }

        currentAccountRows.rows.push(row);
    }

    return rowsByAccount;
};

export interface BuildGroupedAssetOptionsProps {
    assetRows: readonly AccountWithTokensOption[];
    tradableCryptoIds: Set<CryptoId>;
    threshold: BaseCurrencyAmount | null;
    fiatRates: RatesByKey | undefined;
    baseCurrencyCode: BaseCurrencyCode;
    expandedGroupKeys: readonly AssetGroupKey[];
}

export const buildGroupedAssetOptions = ({
    assetRows,
    tradableCryptoIds,
    threshold,
    fiatRates,
    baseCurrencyCode,
    expandedGroupKeys,
}: BuildGroupedAssetOptionsProps): AssetPickerOption[] => {
    const getFiatBalance = (row: AssetRowOption): BaseCurrencyAmount | null => {
        if (row.type === 'token') {
            return row.token.fiatRate ? asBaseCurrencyAmount(row.token.fiatValue) : null;
        }

        return getAccountFiatBalance({
            account: row.account,
            baseCurrencyCode,
            rates: fiatRates,
            shouldIncludeTokens: false,
            shouldIncludeStaking: false,
        });
    };

    const getIsTradable = (row: AssetRowOption) =>
        tradableCryptoIds.has(
            getCryptoId(row.account.symbol, row.type === 'token' ? row.token.contract : undefined),
        );

    const options: AssetPickerOption[] = [];

    for (const { account, rows } of groupRowsByAccount(assetRows.filter(isAssetRowOption))) {
        const { assets, lowBalanceAssets, nonTradableAssets } = groupTradeableAssetsByTradability({
            assets: rows,
            threshold,
            getFiatBalance,
            getIsTradable,
        });

        options.push(...assets);

        if (lowBalanceAssets.length > 0) {
            options.push({
                type: 'low-balance-group',
                account,
                items: lowBalanceAssets,
                expanded: expandedGroupKeys.includes(
                    getAssetGroupKey(account.key, 'low-balance-group'),
                ),
            });
        }

        if (nonTradableAssets.length > 0) {
            options.push({
                type: 'non-tradable-group',
                account,
                items: nonTradableAssets,
                expanded: expandedGroupKeys.includes(
                    getAssetGroupKey(account.key, 'non-tradable-group'),
                ),
            });
        }
    }

    return options;
};
