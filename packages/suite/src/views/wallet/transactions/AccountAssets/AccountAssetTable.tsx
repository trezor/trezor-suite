import { useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { ASSET_TABLE_CELL_PADDING, AssetTableExpandRow, AssetTableFrame } from '@suite/assets';
import { gotoThunk } from '@suite/router';
import {
    ASSET_TABLE_ROW_LIMIT,
    getAccountListSectionKey,
    normalizeAssetSearchQuery,
    selectAccountAssetOverview,
    selectAccountSmallBalances,
    selectAreAssetTableSmallBalancesDisplayed,
} from '@suite-common/assets';
import { selectAccountByKey, selectAreTokensSupportedByAccount } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, Row, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { AssetSearchInput } from '#src/components/wallet/assets/AssetSearchInput';
import { AssetTableFilterHeader } from '#src/components/wallet/assets/AssetTableFilter';
import { useAssetTableFolding } from '#src/components/wallet/assets/useAssetTableFolding';
import { useSelector } from '#src/hooks/suite/useSelector';
import { DropdownRow } from '#src/views/wallet/tokens/DropdownRow';

import { AccountAssetSearchRows } from './AccountAssetSearchRows';
import { AccountAssetSectionRow } from './AccountAssetSectionRow';

type AccountAssetTableProps = {
    accountKey: AccountKey;
};

export const AccountAssetTable = ({ accountKey }: AccountAssetTableProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const [isZeroBalanceOpen, setIsZeroBalanceOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const hasTokens = useSelector(state => selectAreTokensSupportedByAccount(state, accountKey));
    const { listedSections, zeroBalanceSections } = useSelector(state =>
        selectAccountAssetOverview(state, accountKey),
    );
    const smallBalances = useSelector(state => selectAccountSmallBalances(state, accountKey));
    const areSmallBalancesShown = useSelector(selectAreAssetTableSmallBalancesDisplayed);
    const rows = areSmallBalancesShown
        ? listedSections
        : listedSections.filter(
              section => !smallBalances.keys.has(getAccountListSectionKey(section)),
          );
    const isFoldable = rows.length > ASSET_TABLE_ROW_LIMIT;
    const { isExpanded, rowLimit, toggleExpanded, changeSmallBalances } = useAssetTableFolding({
        isFoldable,
    });
    const shownRows = rowLimit === undefined ? rows : rows.slice(0, rowLimit);
    const query = normalizeAssetSearchQuery(searchQuery);

    // The account's own hidden tokens, so the list stays scoped to it and Back returns here.
    const openHiddenTokens = () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'hidden-tokens', from: 'account-overview' },
        });
        dispatch(gotoThunk({ routeName: 'wallet-tokens-hidden', preserveParams: true }));
    };

    if (account === null || account.empty) {
        return null;
    }

    const listRows = (
        <>
            {shownRows.map(section => (
                <AccountAssetSectionRow key={getAccountListSectionKey(section)} section={section} />
            ))}
            {isFoldable && (
                <AssetTableExpandRow isExpanded={isExpanded} onToggle={toggleExpanded} />
            )}
            {zeroBalanceSections.length > 0 && (
                <Table.Row
                    onClick={() => setIsZeroBalanceOpen(!isZeroBalanceOpen)}
                    data-testid="@wallet/account-assets/zero-balance"
                >
                    <Table.Cell colSpan={3} padding={ASSET_TABLE_CELL_PADDING.first}>
                        <DropdownRow
                            isActive={isZeroBalanceOpen}
                            text="ZERO_BALANCE_TOKENS"
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                        />
                    </Table.Cell>
                </Table.Row>
            )}
            {isZeroBalanceOpen &&
                zeroBalanceSections.map(section => (
                    <AccountAssetSectionRow
                        key={getAccountListSectionKey(section)}
                        section={section}
                    />
                ))}
        </>
    );

    return (
        <Column gap={12} alignItems="stretch">
            {hasTokens && (
                <Row justifyContent="flex-end">
                    <AssetSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="TR_SEARCH_TOKENS"
                        data-testid="@wallet/account-assets/search"
                    />
                </Row>
            )}
            <AssetTableFrame
                assetHeader={
                    <AssetTableFilterHeader
                        areSmallBalancesShown={areSmallBalancesShown}
                        smallBalances={smallBalances.summary}
                        onSmallBalancesChange={changeSmallBalances}
                        onOpenHiddenTokens={hasTokens ? openHiddenTokens : undefined}
                    />
                }
                data-testid="@wallet/account-assets/table"
            >
                {query === '' ? (
                    listRows
                ) : (
                    <AccountAssetSearchRows
                        networkSymbol={account.symbol}
                        sections={[...listedSections, ...zeroBalanceSections]}
                        query={query}
                    />
                )}
            </AssetTableFrame>
        </Column>
    );
};
