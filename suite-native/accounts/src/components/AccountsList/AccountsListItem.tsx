import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type StakeRootState,
    getAccountCryptoBalanceWithStaking,
    selectAccountHasStaking,
    selectFormattedAccountType,
    selectIsCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { Badge } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    NetworkDisplaySymbolNameFormatter,
} from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import { isNetworkWithTokens } from '@suite-native/tokens';

import {
    type NativeAccountsRootState,
    selectAccountFiatBalance,
    selectAccountHasAnyKnownTokens,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';
import { AccountLabel } from '../AccountLabel';
import { AccountListTokenBadge } from './AccountListTokenBadge';
import { AccountsListItemBase } from './AccountsListItemBase';
import { StakingBadge } from './StakingBadge';
import { ZeroApyBadge } from './ZeroApyBadge';

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
    shouldShowExactAmount?: boolean;
};

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
    shouldShowExactAmount = false,
}: AccountListItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const hasAnyKnownTokens = useSelector((state: NativeAccountsRootState) =>
        selectAccountHasAnyKnownTokens(state, account.key),
    );

    const accountHasStaking = useSelector((state: StakeRootState) =>
        selectAccountHasStaking(state, account.key),
    );

    const isStakedWithFiveBinaries = useSelector((state: AccountsRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, account.key),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key),
    );

    const handleOnPress = useCallback(() => {
        onPress?.({ account, hasAnyKnownTokens });
    }, [account, hasAnyKnownTokens, onPress]);

    const shouldShowAccountLabel = !isNetworkWithTokens(account.symbol) || !isNativeCoinOnly;
    const shouldShowTokenBadge = hasAnyKnownTokens && !isNativeCoinOnly;
    const shouldShowStakingBadge = accountHasStaking && !isNativeCoinOnly;
    const shouldShowZeroApyBadge = isStakedWithFiveBinaries && !isNativeCoinOnly;
    const fiatBalanceValue = shouldShowTokenBadge ? (
        <BaseCurrencyAmountFormatter
            numberOfLines={1}
            adjustsFontSizeToFit
            symbol={account.symbol}
            value={fiatBalance}
        />
    ) : (
        <CryptoToFiatAmountFormatter
            value={
                shouldShowStakingBadge
                    ? getAccountCryptoBalanceWithStaking(account)
                    : account.formattedBalance
            }
            isBalance={true}
            symbol={account.symbol}
        />
    );
    const isFailed = isAccountFailed(account);
    const CryptoAmountFormatter = shouldShowExactAmount
        ? ExactCryptoAmountFormatter
        : CompactCryptoAmountFormatter;

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
            icon={
                <TokenIcon
                    tokenSymbol={account.symbol}
                    networkSymbol={account.symbol}
                    showNetworkIcon={isNativeCoinOnly}
                />
            }
            title={title}
            badges={
                <>
                    {!isNativeCoinOnly && !!formattedAccountType && (
                        <Badge label={formattedAccountType} size="small" />
                    )}
                    {shouldShowZeroApyBadge ? (
                        <ZeroApyBadge />
                    ) : (
                        shouldShowStakingBadge && (
                            <StakingBadge networkSymbol={account.symbol} account={account} />
                        )
                    )}
                    {shouldShowTokenBadge && <AccountListTokenBadge accountKey={account.key} />}
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
                isFailed || shouldShowTokenBadge || shouldShowStakingBadge ? undefined : (
                    <CryptoAmountFormatter
                        testID="@accountList/item/native-balance"
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
