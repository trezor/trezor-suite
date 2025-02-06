import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { Badge, RoundedIcon } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    FiatAmountFormatter,
    NetworkDisplaySymbolNameFormatter,
} from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { NativeStakingRootState, selectAccountHasStaking } from '@suite-native/staking';
import {
    TokensRootState,
    isCoinWithTokens,
    selectAccountHasAnyKnownToken,
    selectNumberOfAccountTokensWithFiatRates,
} from '@suite-native/tokens';

import { AccountsListItemBase } from './AccountsListItemBase';
import { StakingBadge } from './StakingBadge';
import { NativeAccountsRootState, selectAccountFiatBalance } from '../../selectors';
import { OnSelectAccount } from '../../types';

export type AccountListItemProps = {
    account: Account;
    isNativeCoinOnly?: boolean;
    onPress?: OnSelectAccount;
    disabled?: boolean;
    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    showDivider?: boolean;
};

const TokenBadge = React.memo(({ accountKey }: { accountKey: AccountKey }) => {
    const numberOfTokens = useSelector((state: TokensRootState) =>
        selectNumberOfAccountTokensWithFiatRates(state, accountKey),
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
}: AccountListItemProps) => {
    const { accountLabel } = account;

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const accountHasAnyTokens = useSelector((state: TokensRootState) =>
        selectAccountHasAnyKnownToken(state, account.key),
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
            hasAnyKnownTokens: accountHasAnyTokens,
            hasStaking: accountHasStaking,
        });
    }, [account, accountHasAnyTokens, accountHasStaking, onPress]);

    const icon = useMemo(
        () =>
            isNativeCoinOnly ? (
                <CryptoIconWithNetwork symbol={account.symbol} />
            ) : (
                <RoundedIcon symbol={account.symbol} />
            ),
        [account.symbol, isNativeCoinOnly],
    );

    const doesCoinSupportTokens = isCoinWithTokens(account.symbol);
    const shouldShowAccountLabel = !doesCoinSupportTokens || !isNativeCoinOnly;
    const shouldShowTokenBadge = accountHasAnyTokens && !isNativeCoinOnly;
    const shouldShowStakingBadge = accountHasStaking && !isNativeCoinOnly;

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            showDivider={showDivider}
            onPress={handleOnPress}
            disabled={disabled}
            icon={icon}
            title={
                shouldShowAccountLabel ? (
                    accountLabel
                ) : (
                    <NetworkDisplaySymbolNameFormatter value={account.symbol} />
                )
            }
            badges={
                <>
                    {formattedAccountType && (
                        <Badge label={formattedAccountType} size="small" elevation="1" />
                    )}
                    {shouldShowStakingBadge && <StakingBadge />}
                    {shouldShowTokenBadge && <TokenBadge accountKey={account.key} />}
                </>
            }
            mainValue={
                shouldShowTokenBadge && fiatBalance !== undefined ? (
                    <FiatAmountFormatter
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
                )
            }
            secondaryValue={
                <CryptoAmountFormatter
                    value={account.formattedBalance}
                    symbol={account.symbol}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            }
        />
    );
};
