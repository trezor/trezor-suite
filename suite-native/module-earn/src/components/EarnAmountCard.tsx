import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AccountLabel, AccountTypeBadge, AccountsListItemBase } from '@suite-native/accounts';
import { Card, ErrorMessage } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type EarnAmountCardProps = {
    accountKey: AccountKey;
    label?: ReactNode;
    cryptoAmount?: string;
};

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillSunken,
    borderColor: utils.colors.surfaceBorderSunken,
    borderWidth: utils.borders.widths.small,
    pointerEvents: 'none',
}));

export const EarnAmountCard = ({ accountKey, label, cryptoAmount }: EarnAmountCardProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) {
        return (
            <ErrorMessage
                errorMessage={translate('moduleAccounts.accountNotFound', { accountKey })}
            />
        );
    }

    const amount = cryptoAmount ?? account.formattedBalance;

    return (
        <Card noPadding noShadow style={applyStyle(cardStyle)}>
            <AccountsListItemBase
                icon={<TokenIcon symbol={account.symbol} />}
                title={label ?? <AccountLabel account={account} />}
                titleBadge={<AccountTypeBadge accountKey={accountKey} />}
                mainValue={
                    <CryptoAmountFormatter
                        value={amount}
                        symbol={account.symbol}
                        variant="body-md-strong"
                        color="contentPrimary"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                }
                secondaryValue={
                    <CryptoToFiatAmountFormatter
                        value={amount}
                        symbol={account.symbol}
                        isBalance
                        variant="body-sm"
                        color="contentSecondary"
                    />
                }
            />
        </Card>
    );
};
