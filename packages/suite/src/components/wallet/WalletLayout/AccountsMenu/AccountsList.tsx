import { memo, useMemo } from 'react';

import { getDefaultAccountLabel } from '@suite/account';
import { selectCoinjoinIsPreloading } from '@suite/coinjoin';
import { Translation, useTranslation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { type RouteParams, selectRouterParams } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import {
    type GetTokensOutputType,
    getTokens,
    selectAllAccountsToList,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { accountSearchFn, getAccountTypeName } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Column } from '@trezor/components';

import { useAccountSearch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AccountSection } from './AccountSection';
import { AccountsMenuNotice } from './AccountsMenuNotice';

type AccountsProps = {
    accountsWithTokens: {
        account: Account;
        tokens: GetTokensOutputType<TokenInfo>;
    }[];
};

const Accounts = memo(({ accountsWithTokens }: AccountsProps) => {
    const params = useSelector(selectRouterParams) as RouteParams;

    return (
        <>
            {accountsWithTokens.map(({ account, tokens }) => {
                const selected =
                    account.symbol === params?.symbol &&
                    account.accountType === params.accountType &&
                    account.index === params.accountIndex;

                return (
                    <AccountSection
                        key={account.key}
                        account={account}
                        tokens={tokens.shownWithBalance}
                        selected={selected}
                    />
                );
            })}
        </>
    );
});

export const AccountsList = memo(() => {
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

    if (!device) {
        return null;
    }

    if (filteredAccounts.length > 0) {
        return (
            <Column gap={4} margin={{ bottom: 20, left: 8, right: 8 }}>
                <Accounts accountsWithTokens={filteredAccounts} />
                {coinjoinIsPreloading && !searchString && !coinFilter && <AccountItemSkeleton />}
            </Column>
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
