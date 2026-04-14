import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { AccountsListItemBase } from '@suite-native/accounts';
import { Badge } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-native/icons';
import { AccountLabel } from '@suite-native/labeling';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';

type ChooseAccountItemProps = {
    account: Account;
    onPress: (account: Account) => void;
    isFirst?: boolean;
    isLast?: boolean;
    showDivider?: boolean;
};

export const ChooseAccountItem = ({
    account,
    onPress,
    isFirst = false,
    isLast = false,
    showDivider = false,
}: ChooseAccountItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );

    const handlePress = useCallback(() => {
        onPress(account);
    }, [account, onPress]);

    return (
        <AccountsListItemBase
            hasBackground
            isFirst={isFirst}
            isLast={isLast}
            showDivider={showDivider}
            onPress={handlePress}
            icon={<CryptoIcon symbol={account.symbol} />}
            title={<AccountLabel account={account} />}
            badges={
                formattedAccountType ? (
                    <Badge label={formattedAccountType} size="small" elevation="1" />
                ) : null
            }
            mainValue={
                <CryptoAmountFormatter
                    value={account.formattedBalance}
                    symbol={account.symbol}
                    decimals={CRYPTO_BALANCE_DECIMALS}
                    variant="body-md-strong"
                    color="contentPrimary"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            }
            secondaryValue={
                <CryptoToFiatAmountFormatter
                    value={account.formattedBalance}
                    symbol={account.symbol}
                    isBalance
                    variant="body-sm"
                    color="contentSecondary"
                />
            }
        />
    );
};
