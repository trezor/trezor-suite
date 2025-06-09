import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccount } from '../../../types/general';

export type AccountListBaseItemProps = {
    receiveAccount: ReceiveAccount;
    label: ReactNode;
    info: ReactNode;
    isAddressDetail: boolean;
    onPress: () => void;
};

type TextColor = 'textDefault' | 'textSubdued';

export const ACCOUNT_LIST_ITEM_HEIGHT = 68 as const;

const labelTextStyle = prepareNativeStyle<{ textColor: TextColor; flex: number }>(
    ({ colors }, { textColor, flex }) => ({
        color: colors[textColor],
        flex,
    }),
);

const amountTextStyle = prepareNativeStyle<{ textColor: TextColor }>(
    ({ colors }, { textColor }) => ({
        color: colors[textColor],
        textAlign: 'right',
        flex: 0,
    }),
);

const bottomContentStyle = prepareNativeStyle<{ hasSingleChildren: boolean }>(
    (_, { hasSingleChildren }) => ({
        alignItems: 'center',
        justifyContent: 'space-between',
        extend: {
            condition: hasSingleChildren,
            style: { justifyContent: 'flex-end' },
        },
    }),
);

const AccountListLabel = ({ label, flex }: { label: ReactNode; flex: number }) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Text
            variant="body"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={applyStyle(labelTextStyle, {
                textColor: 'textDefault',
                flex,
            })}
        >
            {label}
        </Text>
    );
};

export const AccountListBaseItem = ({
    receiveAccount: { account, address },
    label,
    info,
    isAddressDetail,
    onPress,
}: AccountListBaseItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const cryptoValue = isAddressDetail ? (address?.balance ?? '0') : account.availableBalance;

    const shouldDisplayCaret = !isAddressDetail && !!account.addresses;
    const shouldDisplayBalance = !isAddressDetail || address?.balance != null;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={account.accountLabel}
        >
            <HStack
                alignItems="center"
                spacing="sp12"
                paddingVertical="sp12"
                justifyContent="center"
            >
                <Box justifyContent="center">
                    <CryptoIcon symbol={account.symbol} size="extraSmall" />
                </Box>
                {!info && (
                    <Box flex={1}>
                        <AccountListLabel label={label} flex={0} />
                    </Box>
                )}
                <VStack flex={info ? 1 : 0} spacing={0}>
                    <HStack alignItems="center" justifyContent="space-between">
                        {/* If no info is provided, display empty Box to maintain layout consistency */}
                        {info ? <AccountListLabel label={label} flex={1} /> : <Box />}
                        {shouldDisplayBalance && (
                            <CryptoAmountFormatter
                                value={cryptoValue}
                                symbol={account.symbol}
                                variant="body"
                                style={applyStyle(amountTextStyle, {
                                    textColor: 'textDefault',
                                })}
                                accessibilityLabel={translate(
                                    'moduleTrading.accountScreen.balanceCrypto',
                                )}
                                isBalance={false}
                                decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            />
                        )}
                    </HStack>
                    <HStack style={applyStyle(bottomContentStyle, { hasSingleChildren: false })}>
                        <Box>{info}</Box>
                        {shouldDisplayBalance && cryptoValue && (
                            <CryptoToFiatAmountFormatter
                                value={cryptoValue}
                                symbol={account.symbol}
                                variant="hint"
                                style={applyStyle(labelTextStyle, {
                                    textColor: 'textDefault',
                                    flex: 1,
                                })}
                                accessibilityLabel={translate(
                                    'moduleTrading.accountScreen.balanceFiat',
                                )}
                            />
                        )}
                    </HStack>
                </VStack>
                {shouldDisplayCaret && (
                    <Box justifyContent="center">
                        <Icon
                            name="caretRight"
                            color="textSecondaryHighlight"
                            accessibilityHint={translate('moduleTrading.accountScreen.step2Hint')}
                        />
                    </Box>
                )}
            </HStack>
        </Pressable>
    );
};
