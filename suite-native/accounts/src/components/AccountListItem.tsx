import React from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';

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
    const { FiatAmountFormatter } = useFormatters();

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
                <Text color="gray800" variant="hint">
                    {FiatAmountFormatter.format(account.formattedBalance)}
                </Text>
                <Text variant="hint" color="gray600">
                    {account.balance} BTC
                </Text>
            </Box>
        </Box>
    );
};
