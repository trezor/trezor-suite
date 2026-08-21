import { type ReactNode, type RefObject, memo, useCallback, useMemo } from 'react';

import { getDefaultAccountLabel } from '@suite/account';
import { selectCoinjoinIsPreloading } from '@suite/coinjoin';
import { Translation, useTranslation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { type RouteParams, selectRouterParams } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { getTokens, selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { accountSearchFn, getAccountTypeName } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type BaseItemProps, VirtualizedList } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useAccountSearch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AccountSection } from './AccountSection';
import { AccountsMenuNotice } from './AccountsMenuNotice';

const SECTION_GAP = 4;
const OVERSCAN_SECTION_COUNT = 15;

// The list is bled into by the negative margins of grouped sections, so it carries the
// horizontal padding they need to bleed into.
const LIST_PADDING = { horizontal: 8, bottom: 20 } as const;

// Every section is measured once it mounts; this is only the starting guess used to size the
// scrollbar for sections that have not been rendered yet. A plain account row is 58px tall.
const ESTIMATED_SECTION_HEIGHT = 58;

const SKELETON_ITEM_KEY = 'coinjoin-preloading-skeleton';

type AccountsListItem = BaseItemProps &
    (
        | {
              kind: 'account';
              account: Account;
              tokens: TokenInfo[];
          }
        | { kind: 'skeleton' }
    );

type AccountsListProps = {
    scrollElementRef: RefObject<HTMLDivElement | null>;
    scrollSentinels: ReactNode;
};

export const AccountsList = memo(({ scrollElementRef, scrollSentinels }: AccountsListProps) => {
    const device = useSelector(selectSelectedDevice);
    const baseAccounts = useSelector(selectAllAccountsToList);

    const coinjoinIsPreloading = useSelector(selectCoinjoinIsPreloading);
    const accountLegacyLabels = useSelector(selectAccountLabelsLegacy);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(
            state,
            baseAccounts,
            device?.state?.staticSessionId ?? null,
        ),
    );
    const params = useSelector(selectRouterParams) as RouteParams;

    const { translationString } = useTranslation();
    const { isSidebarCollapsed } = useResponsiveContext();
    const { coinFilter, searchString } = useAccountSearch();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress = discoveryStatus?.status === 'loading';
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    const filteredAccounts = useMemo(
        () =>
            accounts
                .map(account => {
                    const tokens = getTokens({
                        tokens: account.tokens ?? [],
                        symbol: account.symbol,
                        tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
                    });

                    return { account, tokens };
                })
                .filter(({ account, tokens }) => {
                    const { key } = account;

                    if (!searchString && !coinFilter) {
                        return true;
                    }

                    const accountLabel =
                        account.label ??
                        (Object.hasOwn(accountLegacyLabels, key)
                            ? accountLegacyLabels[key]
                            : getDefaultAccountLabel(translationString, account)) ??
                        '';

                    // Mirror the account type badge, which is hidden for normal accounts.
                    const accountTypeTranslationId =
                        account.accountType === 'normal'
                            ? null
                            : getAccountTypeName({
                                  path: account.path,
                                  accountType: account.accountType,
                                  networkType: account.networkType,
                              });

                    return accountSearchFn(account, searchString, {
                        coinsFilter: coinFilter,
                        accountLabel,
                        searchableTokens: tokens.shownWithBalance,
                        accountTypeName: accountTypeTranslationId
                            ? translationString(accountTypeTranslationId)
                            : undefined,
                    });
                }),
        [
            accounts,
            searchString,
            coinFilter,
            accountLegacyLabels,
            tokenDefinitions,
            translationString,
        ],
    );

    const isPreloadingSkeletonShown = coinjoinIsPreloading && !searchString && !coinFilter;

    const items = useMemo((): AccountsListItem[] => {
        const accountItems = filteredAccounts.map(({ account, tokens }): AccountsListItem => ({
            kind: 'account',
            account,
            tokens: tokens.shownWithBalance,
            height: ESTIMATED_SECTION_HEIGHT,
        }));

        if (isPreloadingSkeletonShown) {
            return [...accountItems, { kind: 'skeleton', height: ESTIMATED_SECTION_HEIGHT }];
        }

        return accountItems;
    }, [filteredAccounts, isPreloadingSkeletonShown]);

    // Keying by account makes a measured section height survive searching and reordering.
    const getItemKey = useCallback(
        (item: AccountsListItem) =>
            item.kind === 'account' ? item.account.key : SKELETON_ITEM_KEY,
        [],
    );

    const renderItem = useCallback(
        (item: AccountsListItem) => {
            switch (item.kind) {
                case 'account': {
                    const { account, tokens } = item;
                    const selected =
                        account.symbol === params?.symbol &&
                        account.accountType === params.accountType &&
                        account.index === params.accountIndex;

                    return <AccountSection account={account} tokens={tokens} selected={selected} />;
                }
                case 'skeleton':
                    return <AccountItemSkeleton />;
                default:
                    return exhaustive(item);
            }
        },
        [params],
    );

    if (!device) {
        return null;
    }

    if (items.length > 0) {
        return (
            <VirtualizedList
                ref={scrollElementRef}
                items={items}
                renderItem={renderItem}
                getItemKey={getItemKey}
                scrollSentinels={scrollSentinels}
                listHeight="100%"
                listMinHeight={0}
                padding={LIST_PADDING}
                gap={SECTION_GAP}
                overscan={OVERSCAN_SECTION_COUNT}
                // A section is measured rather than sized, and both its height and the scroll
                // position have to survive the list changing under an open sidebar.
                resetItemHeightsOnItemsChange={false}
                resetScrollOnItemsChange={false}
                measureItems
            />
        );
    }

    if (discoveryInProgress) {
        return <AccountItemSkeleton />;
    }

    if (isSidebarCollapsed) return <AccountsMenuNotice />;

    if (!searchString) return null;

    return (
        <AccountsMenuNotice>
            <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
        </AccountsMenuNotice>
    );
});
