import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { Account } from '@suite-common/wallet-types';

type AccountBalanceProps = {
    account: Account;
    accountName: string;
};

const accountNameStyle = prepareNativeStyle(utils => ({
    ...utils.typography.titleSmall,
    marginBottom: 13,
}));

const cryptoIconStyle = prepareNativeStyle(_ => ({
    marginRight: 12,
}));

export const AccountBalance = ({ account, accountName }: AccountBalanceProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box marginBottom="extraLarge">
            <Text style={applyStyle(accountNameStyle)}>{accountName}</Text>
            <Box flexDirection="row" alignItems="center">
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon size="large" name="btc" />
                </Box>
                <Box>
                    <Text color="gray800">$ {account.formattedBalance}</Text>
                    <Text color="gray600" variant="hint">
                        {account.balance} {account.symbol}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};
