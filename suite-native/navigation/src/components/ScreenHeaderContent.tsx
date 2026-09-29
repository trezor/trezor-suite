import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, Box, Text } from '@suite-native/atoms';
import { type Translation } from '@suite-native/intl';

export type ScreenHeaderContentProps = {
    title?: ReactElement<ComponentProps<typeof Translation>> | string;
    customContent?: ReactNode;
};

export const ScreenHeaderContent = ({ title, customContent }: ScreenHeaderContentProps) => {
    if (customContent) {
        return (
            <Box alignItems="center" flexShrink={1}>
                {customContent}
            </Box>
        );
    }

    if (title) {
        return (
            <AnimatedView entering={FadeIn} exiting={FadeOut}>
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
            </AnimatedView>
        );
    }

    return null;
};
