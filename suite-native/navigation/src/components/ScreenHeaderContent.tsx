import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, Text } from '@suite-native/atoms';

import { ScreenHeaderProps } from './ScreenHeader';

export const ScreenHeaderContent = ({
    title,
    customContent,
}: Pick<ScreenHeaderProps, 'title' | 'customContent'>) => {
    if (customContent) {
        return <Box alignItems="center">{customContent}</Box>;
    }

    if (title) {
        return (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Box alignItems="center">
                    <Text
                        variant="highlight"
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
