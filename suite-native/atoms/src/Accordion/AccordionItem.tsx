import { type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AnimatedChevron } from '../Animated/AnimatedChevron';
import { Box } from '../Box';
import { Divider } from '../Divider';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { AccordionContent } from './AccordionContent';

export type AccordionItemProps = {
    currentIndexOpened: SharedValue<number | null>;
    title: ReactNode;
    content: ReactNode;
    iconName?: IconName;
    index: number;
    isDividerDisplayed?: boolean;
};

const contentStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp8,
}));

const accordionWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

const dividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp16,
    paddingTop: utils.spacings.sp8,
}));

export const AccordionItem = ({
    title,
    content,
    iconName,
    currentIndexOpened,
    index,
    isDividerDisplayed = true,
}: AccordionItemProps) => {
    const { applyStyle } = useNativeStyles();

    const isOpened = useDerivedValue(() => currentIndexOpened.value === index);

    const handlePress = () => {
        if (currentIndexOpened.value === index) {
            // eslint-disable-next-line react-hooks/immutability
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
                        <Text variant="body-sm-strong">{title}</Text>
                    </HStack>
                    <AnimatedChevron isExpanded={isOpened} />
                </HStack>
                <Box>
                    <AccordionContent isOpened={isOpened} style={applyStyle(contentStyle)}>
                        {content}
                    </AccordionContent>
                </Box>
            </VStack>
            {isDividerDisplayed && <Divider style={applyStyle(dividerStyle)} />}
        </Pressable>
    );
};
