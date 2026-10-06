import { type ReactNode } from 'react';
import { SlideInDown } from 'react-native-reanimated';

import { AnimatedBox, Box, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const estimatedRewardsBoxStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSoft,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    borderBottomLeftRadius: utils.borders.radii.r24,
    borderBottomRightRadius: utils.borders.radii.r24,
}));

type EarnScreenFooterProps = {
    children: ReactNode;
    estimatedRewards?: ReactNode;
    secondaryContent?: ReactNode;
};

export const EarnScreenFooter = ({
    children,
    estimatedRewards,
    secondaryContent,
}: EarnScreenFooterProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <AnimatedBox entering={SlideInDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <VStack spacing="sp12">
                    <Box
                        style={estimatedRewards ? applyStyle(estimatedRewardsBoxStyle) : undefined}
                    >
                        {estimatedRewards && <Box paddingVertical="sp12">{estimatedRewards}</Box>}
                        {children}
                    </Box>
                    {secondaryContent}
                </VStack>
            </Box>
        </AnimatedBox>
    );
};
