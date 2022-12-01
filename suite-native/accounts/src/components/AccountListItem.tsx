import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountLabel, selectCoins } from '@suite-common/wallet-core';
import { Box, DiscreetText, Text } from '@suite-native/atoms';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrency } from '@suite-native/module-settings';

export type AccountListItemProps = {
    account: Account;
};

const accountListItemStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray0,
    padding: utils.spacings.medium,
    borderRadius: 12,
    marginBottom: utils.spacings.small,
}));

export const AccountListItem = ({ account }: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, account.key),
    );
    const fiatCurrency = useSelector(selectFiatCurrency);
    const coins = useSelector(selectCoins);
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    const fiatRates = useMemo(
        () => coins.find(coin => coin.symbol === account.symbol),
        [account, coins],
    );
    // TODO this should be done with formatters once they're prepared
    const cryptoAmount = formatNetworkAmount(account.availableBalance, account.symbol);
    const fiatAmount = toFiatCurrency(cryptoAmount, fiatCurrency.label, fiatRates?.current?.rates);

    return (
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            style={applyStyle(accountListItemStyle)}
        >
            <Box flexDirection="row">
                <Box marginRight="small">
                    <CryptoIcon name={account.symbol} />
                </Box>
                <Text color="gray800">{accountLabel}</Text>
            </Box>
            <Box alignItems="flex-end">
                <DiscreetText
                    color="gray800"
                    typography="hint"
                    text={FiatAmountFormatter.format(fiatAmount ?? 0) ?? ''}
                />
                <DiscreetText
                    typography="hint"
                    color="gray600"
                    text={CryptoAmountFormatter.format(account.formattedBalance, {
                        symbol: account.symbol,
                    })}
                />
            </Box>
        </Box>
    );
};
