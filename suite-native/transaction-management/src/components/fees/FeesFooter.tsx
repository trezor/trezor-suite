import { useContext } from 'react';
import Animated, {
    FadeInDown,
    FadeOutDown,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeesRootState, selectAreFeesLoading } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type TokensRootState,
    selectAccountTokenDecimals,
    selectAccountTokenSymbol,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type BaseProps = {
    accountKey: AccountKey;
    isSubmittable: boolean;
    symbol: NetworkSymbol;
    totalAmount: string;
    fee: string;
    tokenContract?: TokenAddress;
};

type FeesFooterProps =
    | (BaseProps & { withSubmitButton: false; onSubmit?: never })
    | (BaseProps & { withSubmitButton: true; onSubmit: () => void });

const CARD_BOTTOM_PADDING = 40;

const cardStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingHorizontal: utils.spacings.sp8,
    backgroundColor: utils.colors.surfaceFillSunken,
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
    ...utils.boxShadows.none,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    bottom: 0,
    width: '100%',
}));

type MainnetSummaryProps = {
    amount: string;
    symbol: NetworkSymbol;
    isLoading?: boolean;
};

const MainnetSummary = ({ amount, symbol, isLoading }: MainnetSummaryProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <Text variant="body-sm-strong">
            <Translation id="transactionManagement.fees.totalAmount" />
        </Text>
        <VStack spacing="sp4" alignItems="flex-end">
            <CryptoToFiatAmountFormatter
                variant="body-sm-strong"
                color="contentPrimary"
                value={amount}
                symbol={symbol}
                isLoading={isLoading}
                isDiscreetText={false}
            />
            <CryptoAmountFormatter
                variant="body-sm"
                color="contentSecondary"
                value={amount}
                symbol={symbol}
                isBalance={false}
                isLoading={isLoading}
                isDiscreetText={false}
            />
        </VStack>
    </HStack>
);

const TokenSummary = ({
    accountKey,
    tokenAmount,
    mainnetFee,
    symbol,
    tokenContract,
    isLoading = false,
}: {
    accountKey: AccountKey;
    tokenAmount: string;
    mainnetFee: string;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    isLoading?: boolean;
}) => {
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    const tokenDecimals = useSelector((state: TokensRootState) =>
        selectAccountTokenDecimals(state, accountKey, tokenContract),
    );

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <VStack spacing="sp4">
                <Text variant="body-sm-strong">
                    <Translation id="transactionManagement.fees.amount" />
                </Text>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="transactions.detail.feeLabel" />
                </Text>
            </VStack>
            <VStack spacing="sp4" alignItems="flex-end">
                <TokenAmountFormatter
                    variant="body-sm-strong"
                    color="contentPrimary"
                    decimals={tokenDecimals ?? undefined}
                    value={tokenAmount}
                    tokenSymbol={tokenSymbol}
                    isDiscreetText={false}
                />
                <CryptoAmountFormatter
                    variant="body-sm"
                    color="contentSecondary"
                    value={mainnetFee}
                    symbol={symbol}
                    isBalance={false}
                    isLoading={isLoading}
                    isDiscreetText={false}
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
    symbol,
    tokenContract,
    withSubmitButton,
}: FeesFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const form = useContext(FormContext);
    const {
        formState: { isSubmitting },
    } = form;

    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, symbol),
    );

    const isSubmitButtonVisible = isSubmittable && withSubmitButton;

    const animatedFooterStyle = useAnimatedStyle(
        () => ({
            paddingBottom: withTiming(isSubmitButtonVisible ? CARD_BOTTOM_PADDING : 0),
        }),
        [isSubmitButtonVisible],
    );

    return (
        <>
            <Card style={applyStyle(cardStyle)}>
                <Animated.View style={animatedFooterStyle}>
                    {tokenContract ? (
                        <TokenSummary
                            accountKey={accountKey}
                            tokenAmount={totalAmount}
                            mainnetFee={fee}
                            symbol={symbol}
                            tokenContract={tokenContract}
                            isLoading={areFeesLoading}
                        />
                    ) : (
                        <MainnetSummary
                            amount={totalAmount}
                            symbol={symbol}
                            isLoading={areFeesLoading}
                        />
                    )}
                </Animated.View>
            </Card>
            {isSubmitButtonVisible && (
                <Animated.View
                    style={applyStyle(buttonWrapperStyle)}
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                >
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel={translate('generic.validateForm')}
                        testID="@transactionManagement/fees-submit-button"
                        onPress={onSubmit}
                        isDisabled={isSubmitting || areFeesLoading}
                    >
                        <Translation id="transactionManagement.fees.submitButton" />
                    </Button>
                </Animated.View>
            )}
        </>
    );
};
