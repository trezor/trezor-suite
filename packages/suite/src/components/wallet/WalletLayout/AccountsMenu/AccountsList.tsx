import { getDefaultAccountLabel } from '@suite/account';
import { Translation, useTranslation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { type RouteParams, selectRouterParams } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { getTokens, selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { accountSearchFn, getAccountTypeName } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useAccountSearch, useSelector } from 'src/hooks/suite';
import { selectCoinjoinIsPreloading } from 'src/reducers/wallet/coinjoinReducer';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { type AccountItemType } from 'src/types/wallet';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AccountSection } from './AccountSection';
import { AccountsMenuNotice } from './AccountsMenuNotice';

interface AccountListProps {
    forceOnlyItemClick?: boolean;
    hideStaking?: boolean;
    onItemClick?: (account: Account, type: AccountItemType) => void;
}

type AccountsProps = {
    accounts: Account[];
    hideStaking?: boolean;
    // NOTE: this is to disable completely default click behavior of the item
    forceOnlyItemClick?: boolean;
    onItemClick?: (account: Account, type: AccountItemType) => void;
};

const Accounts = ({ accounts, forceOnlyItemClick, hideStaking, onItemClick }: AccountsProps) => {
    const params = useSelector(selectRouterParams) as RouteParams;

    return (
        <>
            {accounts.map(account => {
                const selected =
                    account.symbol === params?.symbol &&
                    account.accountType === params.accountType &&
                    account.index === params.accountIndex;

                return (
                    <AccountSection
                        key={account.key}
                        forceOnlyItemClick={forceOnlyItemClick}
                        hideStaking={hideStaking}
                        account={account}
                        selected={selected}
                        onItemClick={onItemClick}
                    />
                );
            })}
        </>
    );
};

export const AccountsList = ({
    forceOnlyItemClick,
    hideStaking,
    onItemClick,
}: AccountListProps) => {
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

    if (!device) {
        return null;
    }

    const filteredAccounts =
        searchString || coinFilter
            ? accounts.filter(account => {
                  const { key } = account;

                  const accountLabel =
                      account.label ??
                      (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                          ? accountLegacyLabels[key]
                          : getDefaultAccountLabel(translationString, account)) ??
                      '';

                  const { shownWithBalance } = getTokens({
                      tokens: account.tokens ?? [],
                      symbol: account.symbol,
                      tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
                  });

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
                      searchableTokens: shownWithBalance,
                      accountTypeName: accountTypeTranslationId
                          ? translationString(accountTypeTranslationId)
                          : undefined,
                  });
              })
            : accounts;

    if (filteredAccounts.length > 0) {
        return (
            <Column gap={4} margin={{ bottom: 20, left: 8, right: 8 }}>
                <Accounts
                    accounts={filteredAccounts}
                    hideStaking={hideStaking}
                    forceOnlyItemClick={forceOnlyItemClick}
                    onItemClick={onItemClick}
                />
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
};
