import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Box, Button } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const SendOutputsScreenFooter = ({
    isSubmitting,
    handleNavigateToReviewScreen,
}: {
    isSubmitting: boolean;
    handleNavigateToReviewScreen: () => void;
}) => {
    const { translate } = useTranslate();

    return (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
            <Box paddingVertical="sp16">
                <Button
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.validateForm')}
                    testID="@send/form-submit-button"
                    onPress={handleNavigateToReviewScreen}
                    isDisabled={isSubmitting}
                >
                    <Translation id="moduleSend.fees.submitButton" />
                </Button>
            </Box>
        </Animated.View>
    );
};
