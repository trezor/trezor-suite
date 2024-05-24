import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { runOnUI } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';
import { IconButton } from '../Button/IconButton';
import { Divider } from '../Divider';
import { VStack } from '../Stack';
import { useAccordionAnimation } from './useAccordionAnimation';

type AccordionItemProps = {
    title: ReactNode;
    content: ReactNode;
};

const triggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.extraSmall,
}));

const titleStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const contentWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    maxWidth: '100%',
}));

const contentStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.small,
}));

const accordionWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

export const AccordionItem = ({ title, content }: AccordionItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { animatedHeightStyle, animatedRef, setHeight, animatedChevronStyle } =
        useAccordionAnimation();

    const toggleIsOpen = () => {
        runOnUI(setHeight)();
    };

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`expand ${title}`}
                onPress={toggleIsOpen}
            >
                <VStack style={applyStyle(accordionWrapperStyle)}>
                    <Box style={applyStyle(triggerStyle)}>
                        <Text style={applyStyle(titleStyle)}>{title}</Text>
                        <Animated.View style={[animatedChevronStyle]}>
                            <IconButton
                                iconName="chevronRight"
                                colorScheme="tertiaryElevation0"
                                size="small"
                                onPress={toggleIsOpen}
                            />
                        </Animated.View>
                    </Box>
                    <Box>
                        <Animated.View style={[animatedHeightStyle]}>
                            <View style={applyStyle(contentWrapperStyle)}>
                                <View
                                    ref={animatedRef}
                                    collapsable={false}
                                    style={applyStyle(contentStyle)}
                                >
                                    {content}
                                </View>
                            </View>
                        </Animated.View>
                    </Box>
                </VStack>
            </Pressable>
            <Divider />
        </>
    );
};
