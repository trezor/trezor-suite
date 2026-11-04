import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountFiatBalance } from '@suite-common/assets';
import {
    type StakingRootState,
    selectAccountCryptoBalanceWithStaking,
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingAccountWithoutPool,
} from '@suite-common/earn-staking';
import { isNetworkWithTokens } from '@suite-common/wallet-config';
import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
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

import { type NativeAccountsRootState, selectAccountHasAnyKnownTokens } from '../../selectors';
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
    shouldAlwaysShowCryptoAmount?: boolean;
    shouldLimitFiatToNativeBalance?: boolean;
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
    shouldAlwaysShowCryptoAmount = false,
    shouldLimitFiatToNativeBalance = false,
}: AccountListItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const hasAnyKnownTokens = useSelector((state: NativeAccountsRootState) =>
        selectAccountHasAnyKnownTokens(state, account.key),
    );

    const isStakingActive = useSelector((state: StakingRootState) =>
        selectIsStakingAccountActive(state, account.key),
    );

    const hasNoPool = useSelector((state: StakingRootState) =>
        selectIsStakingAccountWithoutPool(state, account.key),
    );
    const hasOutdatedProvider = useSelector((state: StakingRootState) =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key),
    );
    const cryptoBalanceWithStaking = useSelector((state: NativeAccountsRootState) =>
        selectAccountCryptoBalanceWithStaking(state, account.key),
    );

    const handleOnPress = useCallback(() => {
        onPress?.({ account, hasAnyKnownTokens });
    }, [account, hasAnyKnownTokens, onPress]);

    const shouldShowAccountLabel = !isNetworkWithTokens(account.symbol) || !isNativeCoinOnly;
    const shouldShowTokenBadge = hasAnyKnownTokens && !isNativeCoinOnly;
    const shouldShowStakingBadge = isStakingActive && !isNativeCoinOnly;
    const shouldShowNoRewardsBadge = (hasOutdatedProvider || hasNoPool) && !isNativeCoinOnly;
    const shouldShowTotalFiat = shouldShowTokenBadge && !shouldLimitFiatToNativeBalance;
    const shouldIncludeStakingInFiat = shouldShowStakingBadge && !shouldLimitFiatToNativeBalance;
    const fiatBalanceValue = shouldShowTotalFiat ? (
        <BaseCurrencyAmountFormatter
            numberOfLines={1}
            adjustsFontSizeToFit
            symbol={account.symbol}
            value={fiatBalance}
        />
    ) : (
        <CryptoToFiatAmountFormatter
            value={shouldIncludeStakingInFiat ? cryptoBalanceWithStaking : account.formattedBalance}
            isBalance={true}
            symbol={account.symbol}
        />
    );
    const isFailed = isAccountFailed(account);
    const isCryptoAmountHidden =
        !shouldAlwaysShowCryptoAmount && (shouldShowTokenBadge || shouldShowStakingBadge);
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
                    {shouldShowNoRewardsBadge ? (
                        <ZeroApyBadge isInformational={hasNoPool} />
                    ) : (
                        shouldShowStakingBadge && (
                            <StakingBadge networkSymbol={account.symbol} accountKey={account.key} />
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
                isFailed || isCryptoAmountHidden ? undefined : (
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
