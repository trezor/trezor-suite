import { useMemo } from 'react';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, HStack, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type SendUtxoScreenFooterProps = {
    selectedTotal: string;
    onSubmit: () => void;
    symbol: NetworkSymbol;
    amount?: string;
};

const gradientStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.sp16,
    top: -utils.spacings.sp16,
}));

const footerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillPage,
}));

export const SendUtxoScreenFooter = ({
    selectedTotal,
    onSubmit,
    amount,
    symbol,
}: SendUtxoScreenFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const missingToAmount = useMemo(
        () =>
            amount && amount !== '0' && Number(selectedTotal) < Number(amount)
                ? Number(amount) - Number(selectedTotal)
                : null,
        [amount, selectedTotal],
    );

    return (
        <>
            <ScreenFooterGradient style={applyStyle(gradientStyle)} />
            <VStack
                style={applyStyle(footerStyle)}
                paddingHorizontal="sp16"
                paddingBottom="sp16"
                paddingTop="sp16"
                spacing="sp12"
            >
                <VStack spacing="sp4">
                    <HStack justifyContent="space-between">
                        <Text variant={missingToAmount ? 'body-sm' : 'body-md'}>
                            <Translation id="moduleSend.coinControl.utxos.selected" />
                        </Text>
                        <CryptoAmountFormatter
                            isBalance={false}
                            variant={missingToAmount ? 'body-sm' : 'body-md'}
                            color={missingToAmount ? 'contentSecondary' : 'contentPrimary'}
                            value={selectedTotal}
                            symbol={symbol}
                            isDiscreetText={false}
                        />
                    </HStack>
                    {missingToAmount && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <HStack justifyContent="space-between">
                                <Text variant="body-md">
                                    <Translation id="moduleSend.coinControl.utxos.remaining" />
                                </Text>
                                <CryptoAmountFormatter
                                    variant="body-md"
                                    value={missingToAmount}
                                    symbol={symbol}
                                    isBalance={false}
                                    isDiscreetText={false}
                                />
                            </HStack>
                        </Animated.View>
                    )}
                </VStack>

                {!missingToAmount && (
                    <Animated.View entering={SlideInDown.duration(300)} exiting={SlideOutDown}>
                        <Button onPress={onSubmit}>
                            <Translation id="generic.buttons.confirm" />
                        </Button>
                    </Animated.View>
                )}
            </VStack>
        </>
    );
};
