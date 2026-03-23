import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

export const SendOutputsScreenFooter = ({
    isSubmitting,
    handleNavigateToReviewScreen,
}: {
    isSubmitting: boolean;
    handleNavigateToReviewScreen: () => void;
}) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <Button
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.validateForm')}
                    testID="@send/form-submit-button"
                    onPress={handleNavigateToReviewScreen}
                    isDisabled={isSubmitting}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
        </Animated.View>
    );
};
