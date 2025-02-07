import { Pressable } from 'react-native';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, HStack, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import { useFiatFromCryptoValue } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccount } from '../../../types';

export type AccountListItemProps = {
    symbol: NetworkSymbol;
    receiveAccount: ReceiveAccount;
    onPress: () => void;
};

type TextStyle = {
    textColor: 'textDefault' | 'textSubdued';
};

export const ACCOUNT_LIST_ITEM_HEIGHT = 68 as const;

const labelTextStyle = prepareNativeStyle<TextStyle>(({ colors }, { textColor }) => ({
    color: colors[textColor],
    flex: 1,
}));

const amountTextStyle = prepareNativeStyle<TextStyle>(({ colors }, { textColor }) => ({
    color: colors[textColor],
    textAlign: 'right',
    flex: 0,
}));

export const AccountListItem = ({
    symbol,
    receiveAccount: { account, address },
    onPress,
}: AccountListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { DisplaySymbolFormatter, FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    const isAddressDetail = !!address;

    const cryptoValue = isAddressDetail ? address.balance : account.availableBalance;
    const fiatValue = useFiatFromCryptoValue({ symbol, cryptoValue });

    const shouldDisplayCaret = !isAddressDetail && !!account.addresses;
    const shouldDisplayBalance = !isAddressDetail || address?.balance != null;
    const label = isAddressDetail ? address.address : account.accountLabel;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={account.accountLabel}
        >
            <HStack alignItems="center" spacing="sp12" paddingVertical="sp12">
                <Box justifyContent="center">
                    <RoundedIcon symbol={symbol} />
                </Box>
                <VStack flex={1} spacing={0}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text
                            variant="body"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={applyStyle(labelTextStyle, { textColor: 'textDefault' })}
                        >
                            {label}
                        </Text>
                        {shouldDisplayBalance && (
                            <Text
                                variant="body"
                                style={applyStyle(amountTextStyle, { textColor: 'textDefault' })}
                                accessibilityLabel={translate(
                                    'moduleTrading.accountSheet.balanceCrypto',
                                )}
                            >
                                <CryptoAmountFormatter
                                    value={cryptoValue}
                                    symbol={account.symbol}
                                />
                            </Text>
                        )}
                    </HStack>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text
                            variant="hint"
                            style={applyStyle(labelTextStyle, { textColor: 'textSubdued' })}
                        >
                            <DisplaySymbolFormatter value={symbol} areAmountUnitsEnabled={false} />
                        </Text>
                        {shouldDisplayBalance && fiatValue && (
                            <Text
                                variant="hint"
                                style={applyStyle(amountTextStyle, { textColor: 'textSubdued' })}
                                accessibilityLabel={translate(
                                    'moduleTrading.accountSheet.balanceFiat',
                                )}
                            >
                                <FiatAmountFormatter value={fiatValue} />
                            </Text>
                        )}
                    </HStack>
                </VStack>
                {shouldDisplayCaret && (
                    <Box justifyContent="center">
                        <Icon
                            name="caretCircleRight"
                            color="textSecondaryHighlight"
                            accessibilityHint={translate('moduleTrading.accountSheet.step2Hint')}
                        />
                    </Box>
                )}
            </HStack>
        </Pressable>
    );
};
