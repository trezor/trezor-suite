import { SlideInDown } from 'react-native-reanimated';

import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { AnimatedBox, Box, Button, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { wrappedNativeFlowMessages } from '../utils/wrappedNativeFlowMessages';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

type YieldWrappedNativeStepFooterProps = {
    flowType: WrappedNativeFlowType;
    isSkipFirst?: boolean;
    isSubmitDisabled: boolean;
    isSubmitLoading?: boolean;
    onSkip?: () => void;
    onSubmit: () => void;
    spentSymbol: string;
};

export const YieldWrappedNativeStepFooter = ({
    flowType,
    isSkipFirst = false,
    isSubmitDisabled,
    isSubmitLoading = false,
    onSkip,
    onSubmit,
    spentSymbol,
}: YieldWrappedNativeStepFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const messages = wrappedNativeFlowMessages[flowType].stepFooter;
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
        <AnimatedBox entering={SlideInDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <VStack spacing="sp8">
                    {isSkipFirst && skipButton}
                    <Button
                        onPress={onSubmit}
                        isDisabled={isSubmitDisabled}
                        isLoading={isSubmitLoading}
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
        </AnimatedBox>
    );
};
