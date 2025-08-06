import { useContext } from 'react';
import Animated, {
    FadeInDown,
    FadeOutDown,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { FeesRootState, selectAreFeesLoading } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    TokensRootState,
    selectAccountTokenDecimals,
    selectAccountTokenSymbol,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type FeesFooterProps = {
    accountKey: AccountKey;
    isSubmittable: boolean;
    onSubmit: () => void;
    symbol: NetworkSymbol;
    totalAmount: string;
    fee: string;
    tokenContract?: TokenAddress;
};

const CARD_BOTTOM_PADDING = 40;

const cardStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingHorizontal: utils.spacings.sp8,
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

type MainnetSummaryProps = {
    amount: string;
    symbol: NetworkSymbol;
    isLoading?: boolean;
};

const MainnetSummary = ({ amount, symbol, isLoading }: MainnetSummaryProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <Text variant="callout">
            <Translation id="transactionManagement.fees.totalAmount" />
        </Text>
        <VStack spacing="sp4" alignItems="flex-end">
            <CryptoToFiatAmountFormatter
                variant="callout"
                color="textDefault"
                value={amount}
                symbol={symbol}
                isLoading={isLoading}
            />
            <CryptoAmountFormatter
                variant="hint"
                color="textSubdued"
                value={amount}
                symbol={symbol}
                isBalance={false}
                isLoading={isLoading}
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
                <Text variant="callout">
                    <Translation id="transactionManagement.fees.amount" />
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
                    tokenSymbol={tokenSymbol}
                />
                <CryptoAmountFormatter
                    variant="hint"
                    color="textSubdued"
                    value={mainnetFee}
                    symbol={symbol}
                    isBalance={false}
                    isLoading={isLoading}
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

    const animatedFooterStyle = useAnimatedStyle(
        () => ({
            paddingBottom: withTiming(isSubmittable ? CARD_BOTTOM_PADDING : 0),
        }),
        [isSubmittable],
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
            {isSubmittable && (
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
