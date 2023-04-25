import React from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountLabel,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { Badge, Box, Text } from '@suite-native/atoms';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { selectIsEthereumAccountWithTokensWithFiatRates } from '@suite-native/ethereum-tokens';
import { SettingsSliceRootState } from '@suite-native/module-settings';

export type AccountListItemProps = {
    account: Account;
};

const accountListItemStyle = prepareNativeStyle<{ isAccountWithTokens: boolean }>(
    (utils, { isAccountWithTokens }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItem: 'center',
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

export const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

export const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.small,
}));

export const AccountListItem = ({ account }: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, account.key),
    );

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );

    const isAccountWithTokens = useSelector((state: FiatRatesRootState & SettingsSliceRootState) =>
        selectIsEthereumAccountWithTokensWithFiatRates(state, account.key),
    );

    return (
        <Box
            style={applyStyle(accountListItemStyle, {
                isAccountWithTokens,
            })}
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="medium">
                    <CryptoIcon name={account.symbol} />
                </Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    <Text>{accountLabel}</Text>
                    {formattedAccountType && (
                        <Badge label={formattedAccountType} size="small" elevation="1" />
                    )}
                </Box>
            </Box>

            <Box style={applyStyle(valuesContainerStyle)}>
                <CryptoToFiatAmountFormatter
                    value={account.availableBalance}
                    network={account.symbol}
                />
                <CryptoAmountFormatter
                    value={account.balance}
                    network={account.symbol}
                    isBalance={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            </Box>
        </Box>
    );
};
