import { useSelector } from 'react-redux';

import { AccountsRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import { SettingsSliceRootState } from '@suite-native/settings';
import {
    isCoinWithTokens,
    selectAccountHasAnyKnownToken,
    TokensRootState,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectAccountFiatBalance } from '../selectors';
import { OnSelectAccount } from '../types';
import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenList } from './TokenList';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: OnSelectAccount;
    hideTokens?: boolean;
}

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
    const hasAnyKnownTokens = useSelector((state: TokensRootState) =>
        selectAccountHasAnyKnownToken(state, account.key),
    );
    const doesCoinSupportTokens = isCoinWithTokens(account.symbol);

    const fiatBalance = useSelector(
        (state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectAccountFiatBalance(state, account.key),
    );

    const shouldShowTokens = doesCoinSupportTokens && !hideTokens;
    const showSeparator = hasAnyKnownTokens && shouldShowTokens;

    return (
        <Box>
            {shouldShowTokens && (
                <HStack alignItems="center" justifyContent="space-between" marginBottom="medium">
                    <Text variant="highlight">{account.accountLabel}</Text>

                    {hasAnyKnownTokens && (
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
            )}
            <Card noPadding>
                <AccountListItem
                    key={account.key}
                    account={account}
                    hideTokens={hideTokens}
                    fiatBalance={fiatBalance}
                    onPress={() =>
                        onSelectAccount({
                            account,
                            hasAnyKnownTokens,
                        })
                    }
                />
                {showSeparator && <Box style={applyStyle(separatorStyle)} />}
                {shouldShowTokens && (
                    <TokenList account={account} onSelectAccount={onSelectAccount} />
                )}
            </Card>
        </Box>
    );
};
