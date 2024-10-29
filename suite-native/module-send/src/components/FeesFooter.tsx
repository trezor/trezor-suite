import { useContext } from 'react';
import Animated, {
    FadeInDown,
    FadeOutDown,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Text, Button, Box, Card, HStack, VStack } from '@suite-native/atoms';
import {
    CryptoToFiatAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountsRootState } from '@suite-common/wallet-core';
import { selectAccountTokenDecimals, selectAccountTokenSymbol } from '@suite-native/tokens';

type FeesFooterProps = {
    accountKey: AccountKey;
    isSubmittable: boolean;
    onSubmit: () => void;
    networkSymbol: NetworkSymbol;
    totalAmount: string;
    fee: string;
    tokenContract?: TokenAddress;
};

const CARD_BOTTOM_PADDING = 40;
const BUTTON_ENTERING_DELAY = 45;

const footerWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const cardStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingTop: utils.spacings.sp8,
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    ...utils.boxShadows.none,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    bottom: 0,
    width: '100%',
}));

const MainnetSummary = ({
    amount,
    networkSymbol,
}: {
    amount: string;
    networkSymbol: NetworkSymbol;
}) => {
    return (
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="callout">
                <Translation id="moduleSend.fees.totalAmount" />
            </Text>
            <VStack spacing="sp4" alignItems="flex-end">
                <CryptoToFiatAmountFormatter
                    variant="callout"
                    color="textDefault"
                    value={amount}
                    network={networkSymbol}
                />
                <CryptoAmountFormatter
                    variant="hint"
                    color="textSubdued"
                    value={amount}
                    network={networkSymbol}
                    isBalance={false}
                />
            </VStack>
        </HStack>
    );
};

const TokenSummary = ({
    accountKey,
    tokenAmount,
    mainnetFee,
    networkSymbol,
    tokenContract,
}: {
    accountKey: AccountKey;
    tokenAmount: string;
    mainnetFee: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
}) => {
    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    const tokenDecimals = useSelector((state: AccountsRootState) =>
        selectAccountTokenDecimals(state, accountKey, tokenContract),
    );

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <VStack spacing="sp4">
                <Text variant="callout">
                    <Translation id="moduleSend.review.outputs.amountLabel" />
                </Text>
                <Text variant="hint" color="textSubdued">
                    <Translation id="transactions.detail.feeLabel" />
                </Text>
            </VStack>
            <VStack spacing="sp4" alignItems="flex-end">
                <TokenAmountFormatter
                    variant="callout"
                    color="textDefault"
                    decimals={tokenDecimals ?? undefined}
                    value={tokenAmount}
                    symbol={tokenSymbol}
                />
                <CryptoAmountFormatter
                    variant="hint"
                    color="textSubdued"
                    value={mainnetFee}
                    network={networkSymbol}
                    isBalance={false}
                />
            </VStack>
        </HStack>
    );
};

export const FeesFooter = ({
    accountKey,
    isSubmittable,
    onSubmit,
    totalAmount,
    fee,
    networkSymbol,
    tokenContract,
}: FeesFooterProps) => {
    const { applyStyle } = useNativeStyles();

    const form = useContext(FormContext);
    const {
        formState: { isSubmitting },
    } = form;

    const animatedFooterStyle = useAnimatedStyle(
        () => ({
            paddingBottom: withTiming(isSubmittable ? CARD_BOTTOM_PADDING : 0),
        }),
        [isSubmittable],
    );

    return (
        <Box style={applyStyle(footerWrapperStyle)}>
            <Card style={applyStyle(cardStyle)}>
                <Animated.View style={animatedFooterStyle}>
                    {tokenContract ? (
                        <TokenSummary
                            accountKey={accountKey}
                            tokenAmount={totalAmount}
                            mainnetFee={fee}
                            networkSymbol={networkSymbol}
                            tokenContract={tokenContract}
                        />
                    ) : (
                        <MainnetSummary amount={totalAmount} networkSymbol={networkSymbol} />
                    )}
                </Animated.View>
            </Card>
            {isSubmittable && (
                <Animated.View
                    style={applyStyle(buttonWrapperStyle)}
                    entering={FadeInDown.delay(BUTTON_ENTERING_DELAY)}
                    exiting={FadeOutDown}
                >
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="validate send form"
                        testID="@send/fees-submit-button"
                        onPress={onSubmit}
                        disabled={isSubmitting}
                    >
                        <Translation id="moduleSend.fees.submitButton" />
                    </Button>
                </Animated.View>
            )}
        </Box>
    );
};
