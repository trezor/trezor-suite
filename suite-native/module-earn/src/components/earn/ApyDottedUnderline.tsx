import { type ReactNode } from 'react';
import { View } from 'react-native';

import { PressableOpacity, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const dottedDividerContainerStyle = prepareNativeStyle(() => ({
    height: 1,
    overflow: 'hidden',
}));

const dottedDividerContentStyle = prepareNativeStyle(({ colors }) => ({
    height: 2,
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: colors.contentSecondary,
    borderRadius: 0.1,
    marginHorizontal: -1,
}));

const DottedDivider = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(dottedDividerContainerStyle)}>
            <View style={applyStyle(dottedDividerContentStyle)} />
        </View>
    );
};

interface ApyDottedUnderlineProps {
    children: ReactNode;
    onPress?: () => void;
}

export const ApyDottedUnderline = ({ children, onPress }: ApyDottedUnderlineProps) => {
    const content = (
        <VStack spacing="sp2">
            {children}
            <DottedDivider />
        </VStack>
    );

    if (onPress) {
        return <PressableOpacity onPress={onPress}>{content}</PressableOpacity>;
    }

    return content;
};
