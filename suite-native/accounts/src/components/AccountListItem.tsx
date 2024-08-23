import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    AccountsRootState,
    FiatRatesRootState,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Badge, Box, HStack, RoundedIcon, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { SettingsSliceRootState } from '@suite-native/settings';
import { isCoinWithTokens, selectNumberOfAccountTokensWithFiatRates } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type AccountListItemProps = {
    account: Account;
    hideTokens?: boolean;
};

const accountListItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',

    paddingVertical: 12,
    paddingHorizontal: utils.spacings.medium,
}));

const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.small,
}));

export const AccountListItem = ({ account, hideTokens = false }: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
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
        <Box style={applyStyle(accountListItemStyle)}>
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="medium">
                    <RoundedIcon name={account.symbol} />
                </Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    {shouldShowAccountLabel ? (
                        <Text>{accountLabel}</Text>
                    ) : (
                        <Text>
                            <NetworkNameFormatter value={account.symbol} />
                        </Text>
                    )}
                    <HStack spacing="extraSmall">
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
                    </HStack>
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
