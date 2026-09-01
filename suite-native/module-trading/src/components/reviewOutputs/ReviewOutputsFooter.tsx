import Animated, { SlideInDown } from 'react-native-reanimated';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScrollToEndOnMount } from '@suite-native/scrollview';

export type ReviewOutputsFooterProps = {
    onSend: () => void;
    isConsentRequested: boolean;
    isPastDeadline: boolean;
    isSendInProgress: boolean;
    testID?: string;
};

export const ReviewOutputsFooter = ({
    isConsentRequested,
    isPastDeadline,
    isSendInProgress,
    onSend,
    testID,
}: ReviewOutputsFooterProps) => {
    const handleSendTransaction = () => {
        if (isSendInProgress || isPastDeadline) {
            return;
        }

        onSend();
    };

    const buttonTestID = testID ? `${testID}/submit-button` : undefined;

    return (
        <Animated.View entering={SlideInDown} testID={testID}>
            <ScrollToEndOnMount>
                <Button
                    isLoading={isSendInProgress}
                    isDisabled={!isConsentRequested || isPastDeadline}
                    accessibilityRole="button"
                    testID={buttonTestID}
                    onPress={handleSendTransaction}
                >
                    <Translation id="moduleTrading.tradingReviewOutputs.submitButton" />
                </Button>
            </ScrollToEndOnMount>
        </Animated.View>
    );
};
