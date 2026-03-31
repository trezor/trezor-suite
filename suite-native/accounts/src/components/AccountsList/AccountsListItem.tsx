import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { Badge } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    NetworkDisplaySymbolNameFormatter,
} from '@suite-native/formatters';
import { CryptoIcon, CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import { type NativeStakingRootState, selectAccountHasStaking } from '@suite-native/staking';
import {
    type TokensRootState,
    isNetworkWithTokens,
    selectNumberOfAccountKnownTokensWithBalance,
} from '@suite-native/tokens';

import { AccountsListItemBase } from './AccountsListItemBase';
import { StakingBadge } from './StakingBadge';
import { type NativeAccountsRootState, selectAccountFiatBalance } from '../../selectors';
import { type OnSelectAccount } from '../../types';

export type AccountListItemProps = {
    account: Account;
    isNativeCoinOnly?: boolean;
    onPress?: OnSelectAccount;
    disabled?: boolean;
    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    showDivider?: boolean;
    isCryptoBalancePrimary?: boolean;
    titleLabel?: React.ReactNode;
};

const CRYPTO_PRIMARY_BALANCE_TEXT_PROPS = [
    { variant: 'body-md-strong' as const, color: 'textDefault' as const },
    { variant: 'body-sm' as const, color: 'textSubdued' as const },
];

const TokenBadge = React.memo(({ accountKey }: { accountKey: AccountKey }) => {
    const numberOfTokens = useSelector((state: TokensRootState) =>
        selectNumberOfAccountKnownTokensWithBalance(state, accountKey),
    );

    return (
        <Badge
            elevation="1"
            size="small"
            label={<Translation id="accountList.numberOfTokens" values={{ numberOfTokens }} />}
        />
    );
});

export const AccountsListItem = ({
    account,
    onPress,
    disabled,
    isNativeCoinOnly = false,
    hasBackground = false,
    isFirst = false,
    isLast = false,
    showDivider = false,
    isCryptoBalancePrimary = false,
    titleLabel,
}: AccountListItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const accountHasKnownTokensWithBalance = useSelector(
        (state: TokensRootState) =>
            selectNumberOfAccountKnownTokensWithBalance(state, account.key) > 0,
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
            hasStaking: accountHasStaking,
        });
    }, [account, accountHasKnownTokensWithBalance, accountHasStaking, onPress]);

    const icon = useMemo(
        () =>
            isNativeCoinOnly ? (
                <CryptoIconWithNetwork symbol={account.symbol} />
            ) : (
                <CryptoIcon symbol={account.symbol} />
            ),
        [account.symbol, isNativeCoinOnly],
    );

    const isNetworkSupportingTokens = isNetworkWithTokens(account.symbol);
    const shouldShowAccountLabel = !isNetworkSupportingTokens || !isNativeCoinOnly;
    const shouldShowTokenBadge = accountHasKnownTokensWithBalance && !isNativeCoinOnly;
    const shouldShowStakingBadge = accountHasStaking && !isNativeCoinOnly;
    const [primaryBalanceTextProps, secondaryBalanceTextProps] = isCryptoBalancePrimary
        ? CRYPTO_PRIMARY_BALANCE_TEXT_PROPS
        : [undefined, undefined];
    const fiatBalanceValue =
        shouldShowTokenBadge && fiatBalance !== undefined ? (
            <BaseCurrencyAmountFormatter
                numberOfLines={1}
                adjustsFontSizeToFit
                value={fiatBalance}
                {...secondaryBalanceTextProps}
            />
        ) : (
            <CryptoToFiatAmountFormatter
                value={account.formattedBalance}
                isBalance={true}
                symbol={account.symbol}
                {...secondaryBalanceTextProps}
            />
        );
    const cryptoBalanceValue = (
        <CryptoAmountFormatter
            value={account.formattedBalance}
            symbol={account.symbol}
            numberOfLines={1}
            adjustsFontSizeToFit
            {...primaryBalanceTextProps}
        />
    );

    const getTitle = () => {
        if (titleLabel) {
            return titleLabel;
        }

        if (shouldShowAccountLabel) {
            return <AccountLabel account={account} />;
        }

        return <NetworkDisplaySymbolNameFormatter value={account.symbol} />;
    };

    const title = getTitle();

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            showDivider={showDivider}
            onPress={handleOnPress}
            disabled={disabled}
            icon={icon}
            title={title}
            badges={
                <>
                    {formattedAccountType && (
                        <Badge label={formattedAccountType} size="small" elevation="1" />
                    )}
                    {shouldShowStakingBadge && (
                        <StakingBadge networkSymbol={account.symbol} account={account} />
                    )}
                    {shouldShowTokenBadge && <TokenBadge accountKey={account.key} />}
                </>
            }
            mainValue={isCryptoBalancePrimary ? cryptoBalanceValue : fiatBalanceValue}
            secondaryValue={isCryptoBalancePrimary ? fiatBalanceValue : cryptoBalanceValue}
        />
    );
};
