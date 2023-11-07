import { useSelector } from 'react-redux';

import { AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Badge, Box, RoundedIcon, Text } from '@suite-native/atoms';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { selectIsEthereumAccountWithTokensWithFiatRates } from '@suite-native/ethereum-tokens';
import { SettingsSliceRootState } from '@suite-native/module-settings';

export type AccountListItemProps = {
    account: Account;
    areTokensDisplayed?: boolean;
};

const accountListItemStyle = prepareNativeStyle<{ isFollowedByTokens: boolean }>(
    (_, { isFollowedByTokens }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItem: 'center',
        extend: {
            condition: isFollowedByTokens,
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
    paddingLeft: utils.spacings.s,
}));

export const AccountListItem = ({ account, areTokensDisplayed = false }: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { accountLabel } = account;

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );

    const isAccountWithTokens = useSelector((state: FiatRatesRootState & SettingsSliceRootState) =>
        selectIsEthereumAccountWithTokensWithFiatRates(state, account.key),
    );

    return (
        <Box
            style={applyStyle(accountListItemStyle, {
                isFollowedByTokens: areTokensDisplayed && isAccountWithTokens,
            })}
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="m">
                    <RoundedIcon name={account.symbol} />
                </Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    <Text>{accountLabel}</Text>
                    {formattedAccountType && (
                        <Badge label={formattedAccountType} size="s" elevation="1" />
                    )}
                </Box>
            </Box>

            <Box style={applyStyle(valuesContainerStyle)}>
                <CryptoToFiatAmountFormatter
                    value={account.availableBalance}
                    network={account.symbol}
                />
                <CryptoAmountFormatter
                    value={account.availableBalance}
                    network={account.symbol}
                    isBalance={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            </Box>
        </Box>
    );
};
