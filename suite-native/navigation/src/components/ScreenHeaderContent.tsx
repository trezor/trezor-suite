import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, Box, Text } from '@suite-native/atoms';
import { type Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const titleContainerStyle = prepareNativeStyle(() => ({ flex: 1 }));

export type ScreenHeaderContentProps = {
    title?: ReactElement<ComponentProps<typeof Translation>> | string;
    customContent?: ReactNode;
};

export const ScreenHeaderContent = ({ title, customContent }: ScreenHeaderContentProps) => {
    const { applyStyle } = useNativeStyles();

    if (customContent) {
        return (
            <Box alignItems="center" flex={1}>
                {customContent}
            </Box>
        );
    }

    if (title) {
        return (
            <AnimatedView
                entering={FadeIn}
                exiting={FadeOut}
                style={applyStyle(titleContainerStyle)}
            >
                <Text
                    variant="body-md-strong"
                    textAlign="center"
                    numberOfLines={1}
                    testID="@screen/sub-header/title"
                >
                    {title}
                </Text>
            </AnimatedView>
        );
    }

    return null;
};
