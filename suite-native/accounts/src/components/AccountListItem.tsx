import { useSelector } from 'react-redux';
import { TouchableOpacityProps } from 'react-native';

import { useFormatters } from '@suite-common/formatters';
import {
    AccountsRootState,
    FiatRatesRootState,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Badge, RoundedIcon } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { SettingsSliceRootState } from '@suite-native/settings';
import { isCoinWithTokens, selectNumberOfAccountTokensWithFiatRates } from '@suite-native/tokens';

import { AccountListItemBase } from './AccountListItemBase';

export type AccountListItemProps = {
    account: Account;
    hideTokens?: boolean;

    onPress?: TouchableOpacityProps['onPress'];
    disabled?: boolean;
};

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
    const numberOfTokens = useSelector(
        (state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectNumberOfAccountTokensWithFiatRates(state, account.key),
    );

    const doesCoinSupportTokens = isCoinWithTokens(account.symbol);
    const shouldShowAccountLabel = !doesCoinSupportTokens || hideTokens;
    const shouldShowTokenBadge = numberOfTokens > 0 && hideTokens;

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
                    {shouldShowTokenBadge && (
                        <Badge
                            elevation="1"
                            size="small"
                            label={
                                <Translation
                                    id="accountList.numberOfTokens"
                                    values={{ numberOfTokens }}
                                />
                            }
                        />
                    )}
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
