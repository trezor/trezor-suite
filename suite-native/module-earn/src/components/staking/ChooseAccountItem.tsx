import { useCallback } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { AccountLabel } from '@suite-native/accounts';
import { Box, Card, PressableOpacity, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    CryptoToFiatAmountFormatter,
    TokenToFiatAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type ChooseAccountBalanceData } from '../../utils/staking/chooseAccountBalanceUtils';

const itemCardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const rowStyle = prepareNativeStyle(utils => ({
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
}));

const labelStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const valuesStyle = prepareNativeStyle(utils => ({
    alignItems: 'flex-end',
    flexShrink: 1,
    paddingLeft: utils.spacings.sp8,
}));

type ChooseAccountItemProps = {
    account: Account;
    balanceData: ChooseAccountBalanceData;
    onPress: (account: Account) => void;
};

export const ChooseAccountItem = ({ account, balanceData, onPress }: ChooseAccountItemProps) => {
    const { applyStyle } = useNativeStyles();

    const handlePress = useCallback(() => {
        onPress(account);
    }, [account, onPress]);

    return (
        <Card borderColor="borderNeutral" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={handlePress} style={applyStyle(rowStyle)}>
                <Box marginRight="sp12">
                    <TokenIcon symbol={account.symbol} />
                </Box>

                <Box style={applyStyle(labelStyle)}>
                    <AccountLabel
                        account={account}
                        showAccountTypeBadge
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    />
                </Box>

                <VStack spacing="sp2" style={applyStyle(valuesStyle)}>
                    {balanceData.type === 'account' ? (
                        <>
                            <CompactCryptoAmountFormatter
                                value={balanceData.value}
                                symbol={account.symbol}
                                variant="body-md"
                                color="contentPrimary"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            />
                            <CryptoToFiatAmountFormatter
                                value={balanceData.value}
                                symbol={account.symbol}
                                isBalance
                                variant="body-sm"
                                color="contentSecondary"
                                numberOfLines={1}
                            />
                        </>
                    ) : (
                        <>
                            <CompactTokenAmountFormatter
                                value={asDecimalTokenAmount(balanceData.value)}
                                tokenSymbol={balanceData.tokenSymbol}
                                tokenDecimals={balanceData.tokenDecimals}
                                variant="body-md"
                                color="contentPrimary"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            />
                            <TokenToFiatAmountFormatter
                                value={balanceData.value}
                                symbol={account.symbol}
                                contract={balanceData.tokenContractAddress}
                                variant="body-sm"
                                color="contentSecondary"
                                numberOfLines={1}
                            />
                        </>
                    )}
                </VStack>

                <Box marginLeft="sp12">
                    <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                </Box>
            </PressableOpacity>
        </Card>
    );
};
