import { type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AnimatedChevron } from '../Animated/AnimatedChevron';
import { Box } from '../Box';
import { Divider } from '../Divider';
import { HStack } from '../Stack';
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

const accordionWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

const titleStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

const dividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp16,
    paddingTop: utils.spacings.sp16,
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
            <Box style={applyStyle(accordionWrapperStyle)}>
                <HStack spacing="sp16" alignItems="center">
                    {iconName && <Icon name={iconName} size="mediumLarge" />}
                    <Text variant="body-sm" style={applyStyle(titleStyle)}>
                        {title}
                    </Text>
                    <AnimatedChevron isExpanded={isOpened} />
                </HStack>
                <AccordionContent isOpened={isOpened}>{content}</AccordionContent>
            </Box>
            {isDividerDisplayed && <Divider style={applyStyle(dividerStyle)} />}
        </Pressable>
    );
};
