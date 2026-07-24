import { type ReactNode } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { BottomSheetGrabber, Box, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type YieldPendingTransactionModalHeaderProps = {
    caretAnimatedStyle: AnimatedStyle<ViewStyle>;
    onToggleSheet: () => void;
    title: ReactNode;
};

const headerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

const caretButtonStyle = prepareNativeStyle(utils => ({
    padding: 14,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillNeutralSoft,
}));

export const YieldPendingTransactionModalHeader = ({
    caretAnimatedStyle,
    onToggleSheet,
    title,
}: YieldPendingTransactionModalHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            <Box marginTop="sp8" marginBottom="sp24">
                <BottomSheetGrabber />
            </Box>
            <HStack
                style={applyStyle(headerStyle)}
                alignItems="center"
                justifyContent="space-between"
            >
                <Text variant="headline-sm">{title}</Text>
                <PressableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Toggle pending transaction details"
                    onPress={onToggleSheet}
                    style={applyStyle(caretButtonStyle)}
                >
                    <Animated.View style={caretAnimatedStyle}>
                        <Icon name="caretDown" color="contentPrimary" size="mediumLarge" />
                    </Animated.View>
                </PressableOpacity>
            </HStack>
        </Box>
    );
};
