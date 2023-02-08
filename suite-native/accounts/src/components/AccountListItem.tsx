import React from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { Box, DiscreetText, Text } from '@suite-native/atoms';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';

export type AccountListItemProps = {
    account: Account;
};

const accountListItemStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray0,
    padding: utils.spacings.medium,
    borderRadius: utils.borders.radii.medium,
}));

export const AccountListItem = ({ account }: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { CryptoAmountFormatter } = useFormatters();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, account.key),
    );

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
                <Text>{accountLabel}</Text>
            </Box>
            <Box alignItems="flex-end">
                <CryptoToFiatAmountFormatter
                    value={account.availableBalance}
                    network={account.symbol}
                />
                <DiscreetText typography="hint" color="gray600">
                    {CryptoAmountFormatter.format(account.formattedBalance, {
                        symbol: account.symbol,
                        isBalance: true,
                    })}
                </DiscreetText>
            </Box>
        </Box>
    );
};
