import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { Badge } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    NetworkDisplaySymbolNameFormatter,
} from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type NativeStakingRootState, selectAccountHasStaking } from '@suite-native/staking';
import { isNetworkWithTokens } from '@suite-native/tokens';

import { AccountsListItemBase } from './AccountsListItemBase';
import { StakingBadge } from './StakingBadge';
import {
    type NativeAccountsRootState,
    selectAccountFiatBalance,
    selectActiveAndDefiTokensCount,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';
import { AccountLabel } from '../AccountLabel';

type AccountListItemProps = {
    account: Account;
    isNativeCoinOnly?: boolean;
    onPress?: OnSelectAccount;
    disabled?: boolean;
    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    showDivider?: boolean;
    badges?: React.ReactNode;
};

const TokenBadge = React.memo(({ accountKey }: { accountKey: AccountKey }) => {
    const numberOfTokens = useSelector((state: NativeAccountsRootState) =>
        selectActiveAndDefiTokensCount(state, accountKey),
    );

    return (
        <Badge
            size="small"
            label={<Translation id="accountList.numberOfTokens" values={{ numberOfTokens }} />}
        />
    );
});

const AccountsListItemComponent = ({
    account,
    onPress,
    disabled,
    isNativeCoinOnly = false,
    hasBackground = false,
    isFirst = false,
    isLast = false,
    showDivider = false,
    badges,
}: AccountListItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const accountHasKnownTokensWithBalance = useSelector(
        (state: NativeAccountsRootState) => selectActiveAndDefiTokensCount(state, account.key) > 0,
    );

    const accountHasStaking = useSelector((state: NativeStakingRootState) =>
        selectAccountHasStaking(state, account.key),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key, accountHasStaking),
    );

    const handleOnPress = useCallback(() => {
        onPress?.({
            account,
            hasAnyKnownTokens: accountHasKnownTokensWithBalance,
        });
    }, [account, accountHasKnownTokensWithBalance, onPress]);

    const isNetworkSupportingTokens = isNetworkWithTokens(account.symbol);
    const shouldShowAccountLabel = !isNetworkSupportingTokens || !isNativeCoinOnly;
    const shouldShowTokenBadge = accountHasKnownTokensWithBalance && !isNativeCoinOnly;
    const shouldShowStakingBadge = accountHasStaking && !isNativeCoinOnly;
    const fiatBalanceValue =
        shouldShowTokenBadge && fiatBalance !== undefined ? (
            <BaseCurrencyAmountFormatter
                numberOfLines={1}
                adjustsFontSizeToFit
                value={fiatBalance}
            />
        ) : (
            <CryptoToFiatAmountFormatter
                value={account.formattedBalance}
                isBalance={true}
                symbol={account.symbol}
            />
        );
    const isFailed = isAccountFailed(account);

    const title = shouldShowAccountLabel ? (
        <AccountLabel account={account} />
    ) : (
        <NetworkDisplaySymbolNameFormatter value={account.symbol} />
    );

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            showDivider={showDivider}
            onPress={handleOnPress}
            disabled={disabled}
            icon={<TokenIcon symbol={account.symbol} showNetworkIcon={isNativeCoinOnly} />}
            title={title}
            titleBadge={
                !isNativeCoinOnly && formattedAccountType ? (
                    <Badge label={formattedAccountType} size="small" />
                ) : undefined
            }
            badges={
                <>
                    {shouldShowStakingBadge && (
                        <StakingBadge networkSymbol={account.symbol} account={account} />
                    )}
                    {shouldShowTokenBadge && <TokenBadge accountKey={account.key} />}
                    {badges}
                </>
            }
            mainValue={
                isFailed ? (
                    <Icon name="warning" color="contentWarning" size="medium" />
                ) : (
                    fiatBalanceValue
                )
            }
            secondaryValue={
                isFailed ? undefined : (
                    <CryptoAmountFormatter
                        value={account.formattedBalance}
                        symbol={account.symbol}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                )
            }
        />
    );
};

export const AccountsListItem = React.memo(AccountsListItemComponent);

AccountsListItem.displayName = 'AccountsListItem';
