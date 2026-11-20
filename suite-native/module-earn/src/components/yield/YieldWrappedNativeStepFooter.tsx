import { SlideInDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { AnimatedBox, Box, Button, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';

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
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const YieldWrappedNativeStepFooter = ({
    flowType,
    isSkipFirst = false,
    isSubmitDisabled,
    isSubmitLoading = false,
    onSkip,
    onSubmit,
    networkSymbol,
    tokenContract,
}: YieldWrappedNativeStepFooterProps) => {
    const token = useTokenMetadata(networkSymbol, tokenContract);
    const { DisplaySymbolFormatter } = useFormatters();
    const spentSymbol = tokenContract
        ? token?.symbol
        : DisplaySymbolFormatter.format(networkSymbol);
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
