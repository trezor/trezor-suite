import { Translation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { type RouteParams, goto, selectRouteName, selectRouterParams } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import {
    SPARK_NETWORK_SYMBOL,
    SparkAccountsMenu,
    selectIsSparkEnabled,
    selectSelectedSparkAccountNumber,
    selectSparkAccountsByWalletDescriptor,
    sparkActions,
} from '@suite-common/spark';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type AccountType } from '@suite-common/wallet-config';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { accountSearchFn, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CollapsedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import {
    useAccountSearch,
    useDefaultAccountLabel,
    useDispatch,
    useSelector,
} from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { type AccountItemType } from 'src/types/wallet';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AccountGroup } from './AccountGroup';
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
    coinjoinIsPreloading?: boolean;
    discoveryInProgress?: boolean;
    hideStaking?: boolean;
    type: AccountType;
    // NOTE: this is to disable completely default click behavior of the item
    forceOnlyItemClick?: boolean;
    onItemClick?: (account: Account, type: AccountItemType) => void;
};

const Accounts = ({
    accounts,
    forceOnlyItemClick,
    hideStaking,
    coinjoinIsPreloading,
    discoveryInProgress,
    type,
    onItemClick,
}: AccountsProps) => {
    const isSkeletonShown = discoveryInProgress || (type === 'coinjoin' && coinjoinIsPreloading);
    const params = useSelector(selectRouterParams) as RouteParams;

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
                        forceOnlyItemClick={forceOnlyItemClick}
                        hideStaking={hideStaking}
                        account={account}
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
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const baseAccounts = useSelector(selectAllAccountsToList);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const routeName = useSelector(selectRouteName);

    const coinjoinIsPreloading = useSelector(state => state.wallet.coinjoin.isPreloading);
    const accountLegacyLabels = useSelector(selectAccountLabelsLegacy);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(
            state,
            baseAccounts,
            device?.state?.staticSessionId ?? null,
        ),
    );

    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { isSidebarCollapsed } = useResponsiveContext();
    const { coinFilter, searchString } = useAccountSearch();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';
    const isSparkEnabled = useSelector(selectIsSparkEnabled);
    const walletDescriptor = device?.state?.staticSessionId
        ? parseDeviceStaticSessionId(device.state.staticSessionId).walletDescriptor
        : null;
    const sparkAccounts = useSelector(state =>
        walletDescriptor ? selectSparkAccountsByWalletDescriptor(state, walletDescriptor) : [],
    );
    const selectedSparkAccountNumber = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccountNumber(state, walletDescriptor) : undefined,
    );
    const isSparkRoute =
        routeName === 'spark-index' || routeName === 'spark-send' || routeName === 'spark-receive';

    if (!device) {
        return null;
    }

    const networkCoinFilter = coinFilter.filter(
        (symbol): symbol is Account['symbol'] => symbol !== SPARK_NETWORK_SYMBOL,
    );
    const sparkFilterMatches = coinFilter.length === 0 || coinFilter.includes(SPARK_NETWORK_SYMBOL);
    const normalizedSearchString = searchString?.trim().toLowerCase();

    const filteredAccounts =
        searchString || coinFilter
            ? accounts.filter(account => {
                  const { key, accountType, symbol, index } = account;

                  const accountLabel =
                      account.label ??
                      (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                          ? accountLegacyLabels[key]
                          : getDefaultAccountLabel({ accountType, symbol, index })) ??
                      '';

                  return accountSearchFn(account, searchString, {
                      coinsFilter: networkCoinFilter,
                      accountLabel,
                  });
              })
            : accounts;

    const filteredSparkAccounts =
        isSparkEnabled && walletDescriptor
            ? sparkAccounts.filter(account => {
                  if (!sparkFilterMatches) {
                      return false;
                  }

                  if (!normalizedSearchString) {
                      return true;
                  }

                  return [
                      'spark',
                      `spark account #${account.accountNumber + 1}`,
                      `account #${account.accountNumber + 1}`,
                      `s${account.accountNumber + 1}`,
                  ].some(value => value.includes(normalizedSearchString));
              })
            : [];

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

        const accountProps: AccountsProps = {
            forceOnlyItemClick,
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

    if (filteredAccounts.length > 0 || filteredSparkAccounts.length > 0) {
        return (
            <Column gap={spacings.xs} margin={{ bottom: spacings.lg }}>
                {buildGroup('coinjoin', coinjoinAccounts)}
                {buildGroup('normal', normalAccounts, true)}
                {buildGroup('taproot', taprootAccounts)}
                {buildGroup('segwit', segwitAccounts)}
                {buildGroup('legacy', legacyAccounts)}
                {buildGroup('ledger', ledgerAccounts)}
                {isSparkEnabled && walletDescriptor && filteredSparkAccounts.length > 0 && (
                    <SparkAccountsMenu
                        accounts={filteredSparkAccounts}
                        isActive={isSparkRoute}
                        isSidebarCollapsed={isSidebarCollapsed}
                        selectedAccountNumber={selectedSparkAccountNumber}
                        onSelectAccount={accountNumber => {
                            dispatch(
                                sparkActions.selectSparkAccount({
                                    accountNumber,
                                    walletDescriptor,
                                }),
                            );
                            dispatch(
                                goto({
                                    routeName:
                                        routeName === 'spark-send' || routeName === 'spark-receive'
                                            ? routeName
                                            : 'spark-index',
                                }),
                            );
                        }}
                    />
                )}
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
