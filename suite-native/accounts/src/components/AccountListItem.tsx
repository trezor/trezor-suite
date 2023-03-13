import React from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { selectIsEthereumAccountWithTokensWithBalance } from '@suite-native/ethereum-tokens';

export type AccountListItemProps = {
    account: Account;
};

const accountListItemStyle = prepareNativeStyle<{ isAccountWithTokens: boolean }>(
    (utils, { isAccountWithTokens }) => ({
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        padding: utils.spacings.medium,
        borderRadius: utils.borders.radii.medium,
        extend: {
            condition: isAccountWithTokens,
            style: {
                paddingBottom: 0,
            },
        },
    }),
);

export const AccountListItem = ({ account }: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, account.key),
    );
    const isAccountWithTokens = useSelector((state: AccountsRootState) =>
        selectIsEthereumAccountWithTokensWithBalance(state, account.key),
    );

    return (
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            style={applyStyle(accountListItemStyle, {
                isAccountWithTokens,
            })}
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
                <CryptoAmountFormatter value={account.formattedBalance} network={account.symbol} />
            </Box>
        </Box>
    );
};
