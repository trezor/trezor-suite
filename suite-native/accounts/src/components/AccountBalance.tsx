import React from 'react';
import { useSelector } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';

type AccountBalanceProps = {
    accountKey: string;
    accountName?: string;
};

const accountNameStyle = prepareNativeStyle(utils => ({
    ...utils.typography.titleSmall,
    marginBottom: 13,
}));

const cryptoIconStyle = prepareNativeStyle(_ => ({
    marginRight: 12,
}));

export const AccountBalance = ({ accountKey, accountName }: AccountBalanceProps) => {
    const { applyStyle } = useNativeStyles();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { FiatAmountFormatter } = useFormatters();

    if (!account) return null;

    return (
        <Box marginBottom="extraLarge">
            <Text style={applyStyle(accountNameStyle)}>{accountName}</Text>
            <Box flexDirection="row" alignItems="center">
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon size="large" name="btc" />
                </Box>
                <Box>
                    <Text color="gray800">
                        {FiatAmountFormatter.format(account.formattedBalance)}
                    </Text>
                    <Text color="gray600" variant="hint">
                        {account.balance} {account.symbol}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};
