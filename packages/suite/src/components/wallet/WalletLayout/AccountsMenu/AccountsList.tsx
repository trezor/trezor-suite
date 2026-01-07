import { findSuiteSyncAccountLabel, selectSuiteSyncAccountLabels } from '@suite-common/suite-sync';
import { AccountType } from '@suite-common/wallet-config';
import { selectAllAccountsToList, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { accountSearchFn, parseAccountKey } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import type { StaticSessionId } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useAccountSearch, useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectAccountLabels as selectAccountLabelsOld } from 'src/reducers/suite/metadataReducer';
import { selectRouterParams } from 'src/reducers/suite/routerReducer';
import { AccountItemType } from 'src/types/wallet';
import { RouteParams } from 'src/utils/suite/router';

import { AccountGroup } from './AccountGroup';
import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AccountSection } from './AccountSection';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { useResponsiveContext } from '../../../../support/suite/ResponsiveContext';
import { selectDiscoveryOverallStatus } from '../../../../utils/wallet/selectDiscoveryOverallStatus';
import { CollapsedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';

interface AccountListProps {
    forceOnlyItemClick?: boolean;
    hideStaking?: boolean;
    onItemClick?: (account: Account, type: AccountItemType) => void;
}

type AccountsProps = {
    accounts: Account[];
    coinjoinIsPreloading?: boolean;
    discoveryInProgress?: boolean;
    hideStaking?: boolean;
    type: AccountType;
    // NOTE: this is to disable completely default click behavior of the item
    forceOnlyItemClick?: boolean;
    onItemClick?: (account: Account, type: AccountItemType) => void;
    deviceStaticSessionId: StaticSessionId;
};

const Accounts = ({
    accounts,
    forceOnlyItemClick,
    hideStaking,
    coinjoinIsPreloading,
    discoveryInProgress,
    type,
    onItemClick,
    deviceStaticSessionId,
}: AccountsProps) => {
    const accountLabels = useSelector(selectAccountLabelsOld);

    const isSkeletonShown = discoveryInProgress || (type === 'coinjoin' && coinjoinIsPreloading);
    const params = useSelector(selectRouterParams) as RouteParams;

    const suiteSyncAccountLabels = useSelector(state =>
        selectSuiteSyncAccountLabels(state, deviceStaticSessionId),
    );

    return (
        <>
            {accounts.map(account => {
                const isSelected = (account: Account) =>
                    params &&
                    account.symbol === params.symbol &&
                    account.accountType === params.accountType &&
                    account.index === params.accountIndex;

                const selected = !!isSelected(account);

                const { accountDescriptor, networkSymbol } = parseAccountKey(account.key);

                const label =
                    findSuiteSyncAccountLabel({
                        accounts: suiteSyncAccountLabels,
                        accountDescriptor,
                        networkSymbol,
                    })?.label ?? accountLabels[account.key];

                return (
                    <AccountSection
                        key={account.key}
                        forceOnlyItemClick={forceOnlyItemClick}
                        hideStaking={hideStaking}
                        account={{
                            ...account,
                            accountLabel: label,
                        }}
                        selected={selected}
                        onItemClick={onItemClick}
                    />
                );
            })}
            {isSkeletonShown && <AccountItemSkeleton />}
        </>
    );
};

export const AccountsList = ({
    forceOnlyItemClick,
    hideStaking,
    onItemClick,
}: AccountListProps) => {
    const device = useSelector(selectSelectedDevice);
    const accounts = useSelector(selectAllAccountsToList);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const coinjoinIsPreloading = useSelector(state => state.wallet.coinjoin.isPreloading);
    const accountLabels = useSelector(selectAccountLabelsOld);

    const suiteSyncAccounts = useSelector(state => {
        if (!device?.state?.staticSessionId) return [];

        return selectSuiteSyncAccountLabels(state, device.state.staticSessionId);
    });

    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { isSidebarCollapsed } = useResponsiveContext();
    const { coinFilter, searchString } = useAccountSearch();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';

    if (!device) {
        return null;
    }

    const filteredAccounts =
        searchString || coinFilter
            ? accounts.filter(account => {
                  const { key, accountType, symbol, index } = account;
                  const accountLabelOld = Object.prototype.hasOwnProperty.call(accountLabels, key)
                      ? accountLabels[key]
                      : getDefaultAccountLabel({ accountType, symbol, index });

                  const { accountDescriptor, networkSymbol } = parseAccountKey(account.key);

                  const accountLabel =
                      findSuiteSyncAccountLabel({
                          accounts: suiteSyncAccounts,
                          accountDescriptor,
                          networkSymbol,
                      })?.label ?? accountLabelOld;

                  return accountSearchFn(account, searchString, {
                      coinsFilter: coinFilter,
                      metadataAccountLabel: accountLabel,
                  });
              })
            : accounts;

    const filterAccountsByType = (type: Account['accountType']) =>
        filteredAccounts.filter(a => a.accountType === type);

    // always show first "normal" account even if they are empty
    const normalAccounts = filteredAccounts.filter(a => a.accountType === 'normal');
    const coinjoinAccounts = filterAccountsByType('coinjoin');
    const taprootAccounts = filterAccountsByType('taproot');
    const segwitAccounts = filterAccountsByType('segwit');
    const legacyAccounts = filterAccountsByType('legacy');
    const ledgerAccounts = filterAccountsByType('ledger');

    const hasMultipleAccounts = filteredAccounts.some(a => a.accountType !== 'normal');

    const keepOpen = (type: Account['accountType']) =>
        selectedAccount.account?.accountType === type || // selected account is from this group
        (type === 'coinjoin' && coinjoinIsPreloading) || // coinjoin account is requested but not yet created
        (!!searchString && searchString.length > 0) || // filter by search string is active
        (type === 'normal' && !hasMultipleAccounts); // always keep normal accounts open

    const buildGroup = (type: Account['accountType'], accounts: Account[], hideLabel?: boolean) => {
        const groupHasBalance = accounts.some(account => account.availableBalance !== '0');

        if (
            !accounts.length &&
            type !== 'normal' &&
            (type !== 'coinjoin' || !coinjoinIsPreloading)
        ) {
            // hide empty groups except normal and preloading coinjoin to show skeletons
            return;
        }

        const deviceStaticSessionId = device.state?.staticSessionId;
        if (deviceStaticSessionId === undefined) {
            return;
        }

        const accountProps: AccountsProps = {
            forceOnlyItemClick,
            accounts,
            onItemClick,
            coinjoinIsPreloading,
            discoveryInProgress: false,
            type,
            deviceStaticSessionId,
        };

        return (
            <>
                <ExpandedSidebarOnly>
                    <AccountGroup
                        key={type}
                        type={type}
                        hideLabel={hideLabel}
                        hasBalance={groupHasBalance}
                        keepOpen={hideLabel || keepOpen(type)}
                    >
                        <Accounts hideStaking={hideStaking} {...accountProps} />
                    </AccountGroup>
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Accounts hideStaking={hideStaking} {...accountProps} />
                </CollapsedSidebarOnly>
            </>
        );
    };

    if (filteredAccounts.length > 0) {
        return (
            <Column gap={spacings.xs} margin={{ bottom: spacings.lg }}>
                {buildGroup('coinjoin', coinjoinAccounts)}
                {buildGroup('normal', normalAccounts, true)}
                {buildGroup('taproot', taprootAccounts)}
                {buildGroup('segwit', segwitAccounts)}
                {buildGroup('legacy', legacyAccounts)}
                {buildGroup('ledger', ledgerAccounts)}
            </Column>
        );
    }

    if (discoveryInProgress) {
        return <AccountItemSkeleton />;
    }

    if (isSidebarCollapsed) return <AccountsMenuNotice />;

    return (
        <AccountsMenuNotice>
            <Translation
                id={!searchString ? 'TR_ACCOUNT_NO_ACCOUNTS' : 'TR_ACCOUNT_SEARCH_NO_RESULTS'}
            />
        </AccountsMenuNotice>
    );
};
