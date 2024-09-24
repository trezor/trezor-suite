import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { Badge, RoundedIcon } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    FiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    isCoinWithTokens,
    selectAccountHasAnyKnownToken,
    selectNumberOfAccountTokensWithFiatRates,
    TokensRootState,
} from '@suite-native/tokens';

import { NativeAccountsRootState, selectAccountFiatBalance } from '../../selectors';
import { OnSelectAccount } from '../../types';
import { AccountsListItemBase } from './AccountsListItemBase';

export type AccountListItemProps = {
    account: Account;
    hideTokens?: boolean;

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
    hideTokens = false,
    hasBackground = false,
    isFirst = false,
    isLast = false,
    showDivider = false,
}: AccountListItemProps) => {
    const { accountLabel } = account;
    const { NetworkNameFormatter } = useFormatters();

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const accountHasAnyTokens = useSelector((state: TokensRootState) =>
        selectAccountHasAnyKnownToken(state, account.key),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key),
    );

    const handleOnPress = useCallback(() => {
        onPress?.({
            account,
            hasAnyKnownTokens: accountHasAnyTokens,
        });
    }, [account, accountHasAnyTokens, onPress]);

    const doesCoinSupportTokens = isCoinWithTokens(account.symbol);
    const shouldShowAccountLabel = !doesCoinSupportTokens || hideTokens;
    const shouldShowTokenBadge = accountHasAnyTokens && hideTokens;

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            showDivider={showDivider}
            onPress={handleOnPress}
            disabled={disabled}
            icon={<RoundedIcon name={account.symbol} />}
            title={
                shouldShowAccountLabel ? (
                    accountLabel
                ) : (
                    <NetworkNameFormatter value={account.symbol} />
                )
            }
            badges={
                <>
                    {formattedAccountType && (
                        <Badge label={formattedAccountType} size="small" elevation="1" />
                    )}
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
                        value={account.availableBalance}
                        network={account.symbol}
                    />
                )
            }
            secondaryValue={
                <CryptoAmountFormatter
                    value={account.availableBalance}
                    network={account.symbol}
                    isBalance={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            }
        />
    );
};
