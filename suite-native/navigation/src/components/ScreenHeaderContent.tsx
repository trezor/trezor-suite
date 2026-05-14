import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, Text } from '@suite-native/atoms';
import { type Translation } from '@suite-native/intl';

export type ScreenHeaderContentProps = {
    title?: ReactElement<ComponentProps<typeof Translation>> | string;
    customContent?: ReactNode;
};

export const ScreenHeaderContent = ({ title, customContent }: ScreenHeaderContentProps) => {
    if (customContent) {
        return <Box alignItems="center">{customContent}</Box>;
    }

    if (title) {
        return (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Box alignItems="center">
                    <Text
                        variant="body-md-strong"
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        testID="@screen/sub-header/title"
                    >
                        {title}
                    </Text>
                </Box>
            </Animated.View>
        );
    }

    return null;
};
