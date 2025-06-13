import { AccountType } from '@suite-common/wallet-config';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { accountSearchFn } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useAccountSearch, useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';

import { AccountGroup } from './AccountGroup';
import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AccountSection } from './AccountSection';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { useAccounts } from '../../../../hooks/wallet';
import { selectDiscoveryOverallStatus } from '../../../../utils/wallet/selectDiscoveryOverallStatus';
import { CollapsedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { useIsSidebarCollapsed } from '../../../suite/layouts/SuiteLayout/Sidebar/utils';

interface AccountListProps {
    onItemClick?: () => void;
}

type AccountsProps = {
    accounts: Account[];
    onItemClick?: () => void;
    coinjoinIsPreloading?: boolean;
    discoveryInProgress?: boolean;
    type: AccountType;
};

const Accounts = ({
    accounts,
    onItemClick,
    coinjoinIsPreloading,
    discoveryInProgress,
    type,
}: AccountsProps) => {
    const accountLabels = useSelector(selectAccountLabels);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { params } = selectedAccount;
    const isSkeletonShown = discoveryInProgress || (type === 'coinjoin' && coinjoinIsPreloading);

    return (
        <>
            {accounts.map(account => {
                const isSelected = (account: Account) =>
                    params &&
                    account.symbol === params.symbol &&
                    account.accountType === params.accountType &&
                    account.index === params.accountIndex;

                const selected = !!isSelected(account);

                return (
                    <AccountSection
                        key={account.key}
                        account={account}
                        selected={selected}
                        accountLabel={accountLabels[account.key]}
                        onItemClick={onItemClick}
                    />
                );
            })}
            {isSkeletonShown && <AccountItemSkeleton />}
        </>
    );
};

export const AccountsList = ({ onItemClick }: AccountListProps) => {
    const device = useSelector(selectSelectedDevice);
    const accounts = useAccounts();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const coinjoinIsPreloading = useSelector(state => state.wallet.coinjoin.isPreloading);
    const accountLabels = useSelector(selectAccountLabels);
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const isSidebarCollapsed = useIsSidebarCollapsed();
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
                  const accountLabel = Object.prototype.hasOwnProperty.call(accountLabels, key)
                      ? accountLabels[key]
                      : getDefaultAccountLabel({ accountType, symbol, index });

                  return accountSearchFn(account, searchString, coinFilter, accountLabel);
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
    const { params } = selectedAccount;

    const keepOpen = (type: Account['accountType']) =>
        params?.accountType === type || // selected account is from this group
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

        const accountProps = {
            accounts,
            onItemClick,
            coinjoinIsPreloading,
            discoveryInProgress: false,
            type,
        };

        return (
            <>
                <ExpandedSidebarOnly>
                    <AccountGroup
                        key={`${device.state}-${type}`}
                        type={type}
                        hideLabel={hideLabel}
                        hasBalance={groupHasBalance}
                        keepOpen={hideLabel || keepOpen(type)}
                    >
                        <Accounts {...accountProps} />
                    </AccountGroup>
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Accounts {...accountProps} />
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
