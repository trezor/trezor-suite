import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
    SharedValue,
    measure,
    useAnimatedRef,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Divider } from '../Divider';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';

export type AccordionItemProps = {
    currentIndexOpened: SharedValue<number | null>;
    title: ReactNode;
    content: ReactNode;
    iconName?: IconName;
    index: number;
    isDividerDisplayed?: boolean;
};

const contentWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    maxWidth: '100%',
}));

const contentStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp8,
}));

const accordionWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

const dividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp16,
}));

const ANIMATION_DURATION = 200;

export const AccordionItem = ({
    title,
    content,
    iconName,
    currentIndexOpened,
    index,
    isDividerDisplayed = true,
}: AccordionItemProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedRef = useAnimatedRef<View>();

    const isOpened = useDerivedValue(() => currentIndexOpened.value === index);

    const animatedHeightStyle = useAnimatedStyle(() => ({
        height: withTiming(isOpened.value ? Number(measure(animatedRef)?.height ?? 0) : 0, {
            duration: ANIMATION_DURATION,
        }),
    }));

    const animatedChevronStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isOpened.value ? -180 : 0}deg`, {
                    duration: ANIMATION_DURATION,
                }),
            },
        ],
    }));

    const handlePress = () => {
        if (currentIndexOpened.value === index) {
            currentIndexOpened.value = null;
        } else {
            currentIndexOpened.value = index;
        }
    };

    return (
        <Pressable onPress={handlePress}>
            <VStack style={applyStyle(accordionWrapperStyle)}>
                <HStack justifyContent="space-between" alignItems="center">
                    <HStack spacing="sp24" flex={1} alignItems="center">
                        {iconName && <Icon name={iconName} size="mediumLarge" />}
                        <Text variant="callout">{title}</Text>
                    </HStack>
                    <Animated.View style={[animatedChevronStyle]}>
                        <Icon name="caretDown" size="mediumLarge" />
                    </Animated.View>
                </HStack>
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
            {isDividerDisplayed && <Divider style={applyStyle(dividerStyle)} />}
        </Pressable>
    );
};
