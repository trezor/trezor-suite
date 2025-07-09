import { useMemo } from 'react';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { ScreenFooterGradient } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type SendUtxoScreenFooterProps = {
    selectedTotal: string;
    onSubmit: () => void;
    symbol: NetworkSymbol;
    amount?: string;
};

const gradientStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.sp16,
    top: -utils.spacings.sp32,
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
            <VStack paddingHorizontal="sp16" paddingBottom="sp16" spacing="sp12">
                <VStack spacing="sp4">
                    <HStack justifyContent="space-between">
                        <Text variant={missingToAmount ? 'hint' : 'body'}>
                            <Translation id="moduleSend.coinControl.utxos.selected" />
                        </Text>
                        <CryptoAmountFormatter
                            isBalance={false}
                            variant={missingToAmount ? 'hint' : 'body'}
                            color={missingToAmount ? 'textSubdued' : 'textDefault'}
                            value={selectedTotal}
                            symbol={symbol}
                        />
                    </HStack>
                    {missingToAmount && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <HStack justifyContent="space-between">
                                <Text variant="body">
                                    <Translation id="moduleSend.coinControl.utxos.remaining" />
                                </Text>
                                <CryptoAmountFormatter
                                    variant="body"
                                    value={missingToAmount}
                                    symbol={symbol}
                                    isBalance={false}
                                />
                            </HStack>
                        </Animated.View>
                    )}
                </VStack>

                {!missingToAmount && (
                    <Animated.View entering={SlideInDown.duration(300)} exiting={SlideOutDown}>
                        <Button onPress={onSubmit}>
                            <Translation id="generic.buttons.confirmSelection" />
                        </Button>
                    </Animated.View>
                )}
            </VStack>
        </>
    );
};
