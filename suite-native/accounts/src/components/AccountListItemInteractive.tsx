import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountsRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import { SettingsSliceRootState } from '@suite-native/settings';
import { isCoinWithTokens, selectAccountHasAnyTokensWithFiatRates } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectAccountFiatBalance } from '../selectors';
import { OnSelectAccount } from '../types';
import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenList } from './TokenList';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: OnSelectAccount;
    hideTokens?: boolean;
}

const cardStyle = prepareNativeStyle(_utils => ({
    padding: 0,
}));

const separatorStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: 1,
    borderBottomColor: utils.colors.borderElevation1,
}));

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
    hideTokens = false,
}: AccountListItemInteractiveProps) => {
    const { applyStyle } = useNativeStyles();
    const hasAnyTokensWithFiatRates = useSelector(
        (state: SettingsSliceRootState & FiatRatesRootState & AccountsRootState) =>
            selectAccountHasAnyTokensWithFiatRates(state, account.key),
    );
    const doesCoinSupportTokens = isCoinWithTokens(account.symbol);

    const fiatBalance = useSelector(
        (state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectAccountFiatBalance(state, account.key),
    );

    const shouldShowHeader = doesCoinSupportTokens && !hideTokens;
    const shouldShowTokens = doesCoinSupportTokens && !hideTokens;
    const showSeparator = hasAnyTokensWithFiatRates && shouldShowTokens;

    return (
        <Box>
            {shouldShowHeader && (
                <>
                    <HStack
                        alignItems="center"
                        justifyContent="space-between"
                        marginBottom="medium"
                    >
                        <Text variant="highlight">{account.accountLabel}</Text>

                        {hasAnyTokensWithFiatRates && (
                            <VStack spacing={0} alignItems="flex-end">
                                <FiatAmountFormatter
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    value={fiatBalance}
                                />
                                <CryptoAmountFormatter
                                    value={account.availableBalance}
                                    network={account.symbol}
                                    isBalance={false}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </VStack>
                        )}
                    </HStack>
                </>
            )}
            <Card style={applyStyle(cardStyle)}>
                <TouchableOpacity
                    onPress={() =>
                        onSelectAccount({
                            account,
                            hasAnyTokensWithFiatRates,
                        })
                    }
                >
                    <AccountListItem key={account.key} account={account} hideTokens={hideTokens} />
                </TouchableOpacity>
                {showSeparator && <Box style={applyStyle(separatorStyle)} />}
                {shouldShowTokens && (
                    <TokenList account={account} onSelectAccount={onSelectAccount} />
                )}
            </Card>
        </Box>
    );
};
