import { useContext } from 'react';
import Animated, {
    FadeInDown,
    FadeOutDown,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Text, Button, Box, Card, HStack, VStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

type FeesFooterProps = {
    isSubmittable: boolean;
    onSubmit: () => void;
    networkSymbol: NetworkSymbol;
    totalAmount: string;
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

export const FeesFooter = ({
    isSubmittable,
    onSubmit,
    totalAmount,
    networkSymbol,
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
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="callout">
                            <Translation id="moduleSend.fees.totalAmount" />
                        </Text>
                        <VStack spacing="sp2" alignItems="flex-end">
                            <CryptoToFiatAmountFormatter
                                variant="callout"
                                color="textDefault"
                                value={totalAmount}
                                network={networkSymbol}
                            />
                            <CryptoAmountFormatter
                                variant="hint"
                                color="textSubdued"
                                value={totalAmount}
                                network={networkSymbol}
                                isBalance={false}
                            />
                        </VStack>
                    </HStack>
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
