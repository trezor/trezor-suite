import { type ReactNode } from 'react';
import { FadeIn } from 'react-native-reanimated';

import { AnimatedView, Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type FeeOptionErrorMessageProps = {
    isVisible: boolean;
    message: ReactNode;
};

const errorStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp8,
    justifyContent: 'center',
    backgroundColor: utils.colors.elementFillCriticalSoft,
    overflow: 'hidden',
}));

export const FeeOptionErrorMessage = ({ isVisible, message }: FeeOptionErrorMessageProps) => {
    const { applyStyle } = useNativeStyles();

    if (!isVisible) {
        return null;
    }

    return (
        <AnimatedView
            entering={FadeIn}
            style={applyStyle(errorStyle)}
            testID="@transactionManagement/fee-option-error-message"
        >
            <HStack alignItems="center" spacing="sp8">
                <Icon name="warningCircle" size="mediumLarge" color="contentCritical" />
                <Box flex={1}>
                    <Text variant="body-sm">{message}</Text>
                </Box>
            </HStack>
        </AnimatedView>
    );
};
