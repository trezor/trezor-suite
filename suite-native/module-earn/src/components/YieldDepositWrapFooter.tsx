import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Box, Button, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

type YieldDepositWrapFooterProps = {
    isSubmitDisabled: boolean;
    nativeSymbol: string;
    onSkip?: () => void;
    onSubmit: () => void;
};

export const YieldDepositWrapFooter = ({
    isSubmitDisabled,
    nativeSymbol,
    onSkip,
    onSubmit,
}: YieldDepositWrapFooterProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <VStack spacing="sp8">
                    <Button
                        onPress={onSubmit}
                        isDisabled={isSubmitDisabled}
                        testID="@yield-deposit-wrap/submit-button"
                    >
                        <Translation
                            id="earn.yieldDepositFlowScreen.wrapSubmitButton"
                            values={{ nativeSymbol }}
                        />
                    </Button>
                    {onSkip && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onPress={onSkip}
                            testID="@yield-deposit-wrap/skip-button"
                        >
                            <Translation id="earn.yieldDepositFlowScreen.wrapSkipButton" />
                        </Button>
                    )}
                </VStack>
            </Box>
        </Animated.View>
    );
};
