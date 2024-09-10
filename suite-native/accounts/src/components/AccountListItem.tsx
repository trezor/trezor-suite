import { TouchableOpacityProps } from 'react-native';
import { useSelector } from 'react-redux';
import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { Badge, RoundedIcon } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    isCoinWithTokens,
    selectAccountHasAnyKnownToken,
    selectNumberOfAccountTokensWithFiatRates,
    TokensRootState,
} from '@suite-native/tokens';

import { AccountListItemBase } from './AccountListItemBase';

export type AccountListItemProps = {
    account: Account;
    hideTokens?: boolean;

    onPress?: TouchableOpacityProps['onPress'];
    disabled?: boolean;
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

export const AccountListItem = ({
    account,
    onPress,
    disabled,
    hideTokens = false,
}: AccountListItemProps) => {
    const { accountLabel } = account;
    const { NetworkNameFormatter } = useFormatters();

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const accountHasAnyTokens = useSelector((state: TokensRootState) =>
        selectAccountHasAnyKnownToken(state, account.key),
    );

    const doesCoinSupportTokens = isCoinWithTokens(account.symbol);
    const shouldShowAccountLabel = !doesCoinSupportTokens || hideTokens;
    const shouldShowTokenBadge = accountHasAnyTokens && hideTokens;

    return (
        <AccountListItemBase
            onPress={onPress}
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
                <CryptoToFiatAmountFormatter
                    value={account.availableBalance}
                    network={account.symbol}
                />
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
