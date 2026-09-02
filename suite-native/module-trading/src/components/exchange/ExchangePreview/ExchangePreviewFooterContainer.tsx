import { type PropsWithChildren } from 'react';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { Box, ScreenFooterGradient } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

export const ExchangePreviewFooterContainer = ({ children }: PropsWithChildren) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View entering={FadeInDown} exiting={FadeOut}>
            <ScreenFooterGradient />
            <Box style={applyStyle(footerStyle)}>{children}</Box>
        </Animated.View>
    );
};
