import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { Box, Button, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const flowMessages = {
    wrap: {
        skipButton: 'earn.yieldDepositFlowScreen.wrapSkipButton',
        submitButton: 'earn.yieldDepositFlowScreen.wrapSubmitButton',
    },
    unwrap: {
        skipButton: 'earn.yieldWithdrawFlowScreen.unwrapSkipButton',
        submitButton: 'earn.yieldWithdrawFlowScreen.unwrapSubmitButton',
    },
} satisfies Record<WrappedNativeFlowType, { skipButton: TxKeyPath; submitButton: TxKeyPath }>;

type YieldWrappedNativeStepFooterProps = {
    flowType: WrappedNativeFlowType;
    isSkipFirst?: boolean;
    isSubmitDisabled: boolean;
    onSkip?: () => void;
    onSubmit: () => void;
    spentSymbol: string;
};

export const YieldWrappedNativeStepFooter = ({
    flowType,
    isSkipFirst = false,
    isSubmitDisabled,
    onSkip,
    onSubmit,
    spentSymbol,
}: YieldWrappedNativeStepFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const messages = flowMessages[flowType];
    const skipButton = onSkip && (
        <Button
            intent="neutral"
            priority="secondary"
            onPress={onSkip}
            testID={`@yield-${flowType}-step/skip-button`}
        >
            <Translation id={messages.skipButton} />
        </Button>
    );

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <VStack spacing="sp8">
                    {isSkipFirst && skipButton}
                    <Button
                        onPress={onSubmit}
                        isDisabled={isSubmitDisabled}
                        testID={`@yield-${flowType}-step/submit-button`}
                    >
                        <Translation
                            id={messages.submitButton}
                            values={{ nativeSymbol: spentSymbol, tokenSymbol: spentSymbol }}
                        />
                    </Button>
                    {!isSkipFirst && skipButton}
                </VStack>
            </Box>
        </Animated.View>
    );
};
