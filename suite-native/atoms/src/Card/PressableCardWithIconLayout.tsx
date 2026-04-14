import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { useTapGesture } from '../useTapGesture';
import { AnimatedContainerCard } from './Card';

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

export type PressableCardWithIconLayoutProps = {
    icon: IconName;
    title: ReactNode;
    description: ReactNode;
    onPress: () => void;
};

export const PressableCardWithIconLayout = ({
    icon,
    title,
    description,
    onPress,
}: PressableCardWithIconLayoutProps) => {
    const { tapGesture, animatedStyle } = useTapGesture({ onPress });
    const { applyStyle } = useNativeStyles();

    return (
        <GestureDetector gesture={tapGesture}>
            <View collapsable={false}>
                <AnimatedContainerCard
                    borderColor="borderElevation1"
                    noPadding
                    animatedStyle={animatedStyle}
                    // Android shadow does not work well with the Reanimated opacity animation.
                    noShadow={Platform.OS === 'android'}
                >
                    <HStack margin="sp16" spacing="sp12">
                        <Box marginVertical="sp2">
                            <Icon name={icon} size="mediumLarge" />
                        </Box>
                        <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                            <Text variant="body-md-strong">{title}</Text>
                            <Text variant="body-sm" color="textSubdued">
                                {description}
                            </Text>
                        </VStack>
                        <Box alignSelf="center">
                            <Icon name="caretRight" size="mediumLarge" color="iconSubdued" />
                        </Box>
                    </HStack>
                </AnimatedContainerCard>
            </View>
        </GestureDetector>
    );
};
