import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type FirmwareInstallationProgressTitlesProps = {
    title: string;
    subtitle?: string;
};

// to avoid layout shift if the length of the content changes or when is this component substituted with <TrezorFacts/>
export const firmwareTitlesWrapperStyle = prepareNativeStyle(_ => ({
    height: 120, // should fit 4 lines of `titleSmall` text
    width: '100%',
}));

export const FirmwareInstallationProgressTitles = ({
    title,
    subtitle,
}: FirmwareInstallationProgressTitlesProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            key={title}
            style={applyStyle(firmwareTitlesWrapperStyle)}
        >
            <Box marginTop="sp12" alignItems="center">
                <Text variant="headline-sm" textAlign="center">
                    {title}
                </Text>
            </Box>
            <Box marginTop="sp8" alignItems="center">
                <Text variant="body-md" color="contentSecondary" textAlign="center">
                    {subtitle}
                </Text>
            </Box>
        </Animated.View>
    );
};
